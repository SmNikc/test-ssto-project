
/* SSTOPatch v3 — drop-in runtime fix for index_14_36.html
 * - Fixes tab navigation (no inline onclick required)
 * - Scroll-to-top on tab change (prevents "opens at bottom")
 * - Map resize after show (OpenLayers or Leaflet)
 * - Robust Excel import (add/replace/cancel, dedupe by keys, header auto-map RU/EN)
 * - Splits combined columns like "ВОЛГА-1, 273456789" → vessel_name + mmsi
 * - Keeps terminals ↔ signals consistent (auto-create placeholder terminal if needed)
 * - Stabilizes table rendering (<td> cells) without cutting features
 * - Adds safe stubs for missing inline handlers so UI doesn’t crash
 */
(function () {
  const log = (...a) => console.log('[SSTO/PATCH3]', ...a);
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  // ---------- Tab handling & scroll-to-top ----------
  window.showSection = function showSection(targetId, btn) {
    try {
      qsa('.content').forEach(s => s.classList.remove('active'));
      const candidates = [
        document.getElementById(targetId),
        document.getElementById(targetId + '-container'),
        document.getElementById(targetId.replace('-container',''))
      ];
      const section = candidates.find(Boolean);
      if (section) section.classList.add('active');

      qsa('.tab').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      else { const b = qs(`.tab[data-tab="${targetId}"]`); if (b) b.classList.add('active'); }

      // scroll fix
      try { window.scrollTo(0, 0); } catch (e) {}

      // map reflow after show
      if (['map', 'map-container'].includes(targetId)) {
        setTimeout(() => {
          try { if (window.olMap && typeof window.olMap.updateSize === 'function') window.olMap.updateSize(); } catch (e) {}
          try { if (window.map && typeof window.map.updateSize === 'function') window.map.updateSize(); } catch (e) {}
          try { if (window.mapObj && typeof window.mapObj.invalidateSize === 'function') window.mapObj.invalidateSize(); } catch (e) {}
        }, 60);
      }
    } catch (e) {
      console.error('showSection error', e);
    }
  };

  // Delegate clicks from any ".tab[data-tab]"
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab[data-tab]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-tab');
    window.showSection(id, btn);
  });

  // ---------- Safe stubs for missing handlers ----------
  [
    'toggleAutoConfirm','configureEmail','exportSettings','importSettings',
    'systemCheck','systemHealthCheck','openFileDialog',
    'syncPoiskMore','syncSearchSea','processEmailQueue'
  ].forEach(fn => {
    if (typeof window[fn] !== 'function') {
      window[fn] = function () {
        console.warn('[SSTO/PATCH3 stub]', fn, 'is not implemented in base file');
        return false;
      };
    }
  });

  // ---------- Excel import (add/replace/cancel) ----------
  // Keys layout used in original static app:
  //   requests  → localStorage['testRequests']
  //   signals   → localStorage['signals']
  //   terminals → localStorage['vessels']  (as in your working build)
  (function attachExcelLoader() {
    if (typeof window.uploadExcel === 'function' && window.uploadExcel.__sstoPatched) return;

    function normalizeHeader(h) {
      if (!h) return '';
      h = String(h).trim();
      const map = {
        'номер стойки':'terminal_number',
        'терминал':'terminal_number',
        'stationnumber':'terminal_number',
        'terminal':'terminal_number',
        'тип':'terminal_type',
        'тип связи':'terminal_type',
        'terminaltype':'terminal_type',
        'тип терминала':'terminal_type',
        'судно':'vessel_name','vessel':'vessel_name','vesselname':'vessel_name',
        'mmsi':'mmsi','имо':'imo','imo':'imo',
        'владелец':'owner','owner':'owner','судовладелец':'owner',
        'последний тест':'last_test','last test':'last_test','last_test':'last_test',
        'статус':'status','status':'status',
        'id':'id','№ заявки':'id','request id':'id','request_id':'id',
        'тип сигнала':'signal_type','signal type':'signal_type',
        'время получения':'received_at','received':'received_at',
        'координаты':'coords','lat':'lat','lng':'lng','lon':'lng','долгота':'lng','широта':'lat',
        'дата теста':'test_date','время теста':'test_time','test date':'test_date','test time':'test_time',
        'contact':'contact_person','контактное лицо':'contact_person',
        'email':'contact_email','электронная почта':'contact_email',
        'phone':'contact_phone','телефон':'contact_phone'
      };
      const key = h.toLowerCase().replace(/[\s_]+/g, ' ');
      return map[key] || h.replace(/\s+/g, '_').toLowerCase();
    }
    function splitCombined(obj) {
      // Split combined text like "ВОЛГА-1, 273456789" or "MMSI: 273456789"
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === 'string') {
          // MMSI extraction from arbitrary text
          if (!/^\d{9}$/.test((obj.mmsi||'').trim())) {
            const mm = v.match(/(^|[\s,:;])(\d{9})(?!\d)/);
            if (mm) obj.mmsi = obj.mmsi || mm[2];
          }
          // Vessel + MMSI in one cell
          if (!obj.vessel_name && /[А-Яа-яA-Za-z]/.test(v) && /[;,]/.test(v)) {
            const m = v.match(/^\s*(.*?)\s*[;,]\s*(\d{9})\s*$/);
            if (m) { obj.vessel_name = m[1]; obj.mmsi = obj.mmsi || m[2]; }
          }
        }
      }
      return obj;
    }
    function parseSheet(ws) {
      const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
      return rows.map(r => {
        const o = {};
        Object.keys(r).forEach(h => { o[normalizeHeader(h)] = r[h]; });
        return splitCombined(o);
      });
    }
    function mergeByKey(newItems, key, store) {
      const index = new Map(store.map((x,i) => [String(x[key] || x.id || ''), i]));
      newItems.forEach(item => {
        const k = String(item[key] || item.id || '').trim();
        if (!k) { store.push(item); return; }
        if (index.has(k)) {
          store[index.get(k)] = { ...store[index.get(k)], ...item };
        } else {
          index.set(k, store.length);
          store.push(item);
        }
      });
      return store;
    }
    function ensureRelationalConsistency() {
      try {
        const signals = JSON.parse(localStorage.getItem('signals') || '[]');
        const terminals = JSON.parse(
          localStorage.getItem('vessels') ||
          localStorage.getItem('terminals') || '[]'
        );
        const tIdx = new Set(terminals.map(t => String(t.terminal_number || t.stationNumber || t.id || '')));
        let added = 0;
        signals.forEach(s => {
          const tn = String(s.terminal_number || s.terminal || s.stationNumber || '').trim();
          if (tn && !tIdx.has(tn)) {
            terminals.push({ terminal_number: tn, vessel_name: s.vessel_name || s.vessel || '', mmsi: s.mmsi || '', terminal_type: s.terminal_type || 'INMARSAT', status: 'unknown' });
            tIdx.add(tn); added++;
          }
        });
        if (added > 0) localStorage.setItem('vessels', JSON.stringify(terminals));
      } catch (e) {
        console.warn('ensureRelationalConsistency failed', e);
      }
    }

    function doImport(file, mode) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        let reqs = [], sigs = [], terms = [];
        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name];
          const arr = parseSheet(ws);
          const headerLine = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, raw:false })[0] || [];
          const has = (kw) => headerLine.some(h => String(h).toLowerCase().includes(kw));
          if (has('заяв') || has('request')) reqs = reqs.concat(arr);
          else if (has('сигнал') || has('signal')) sigs = sigs.concat(arr);
          else if (has('терминал') || has('vessel') || has('mmsi')) terms = terms.concat(arr);
        });

        if (mode === 'replace') {
          localStorage.setItem('testRequests', JSON.stringify(reqs));
          localStorage.setItem('signals', JSON.stringify(sigs));
          localStorage.setItem('vessels', JSON.stringify(terms));
        } else {
          const rq = mergeByKey(reqs, 'id', JSON.parse(localStorage.getItem('testRequests') || '[]'));
          const sg = mergeByKey(sigs, 'id', JSON.parse(localStorage.getItem('signals') || '[]'));
          const tm = mergeByKey(terms,'terminal_number', JSON.parse(localStorage.getItem('vessels') || '[]'));
          localStorage.setItem('testRequests', JSON.stringify(rq));
          localStorage.setItem('signals', JSON.stringify(sg));
          localStorage.setItem('vessels', JSON.stringify(tm));
        }
        ensureRelationalConsistency();

        ['loadDashboard','loadRequests','loadSignals','loadTerminals'].forEach(fn => {
          try { if (typeof window[fn] === 'function') window[fn](); } catch (e) {}
        });
        alert('Импорт Excel завершен (' + mode + ').');
      };
      reader.readAsBinaryString(file);
    }

    window.uploadExcel = function () {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      input.onchange = (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        let mode = 'add';
        const existing = (
          JSON.parse(localStorage.getItem('testRequests') || '[]').length +
          JSON.parse(localStorage.getItem('signals') || '[]').length +
          JSON.parse(localStorage.getItem('vessels') || '[]').length
        );
        if (existing > 0) {
          const ans = prompt('Импорт Excel: введите режим: add (добавить) / replace (переписать) / cancel (отмена)', 'add');
          mode = (ans || '').toLowerCase();
          if (mode === 'cancel') return;
          if (!['add','replace'].includes(mode)) mode = 'add';
        }
        doImport(file, mode);
      };
      input.click();
    };
    window.uploadExcel.__sstoPatched = true;
  })();

  // ---------- Fix table row rendering (<td>) if base code forgot them ----------
  function ensureTdCells(html) {
    const tmp = document.createElement('tbody');
    tmp.innerHTML = html.trim();
    if (tmp.children.length === 0 || tmp.querySelector('td')) return html; // already fine
    const tokens = html.split('\n').map(s => s.trim()).filter(Boolean);
    return tokens.map(t => '<td>' + t + '</td>').join('');
  }

  ['loadRequests','loadSignals','loadTerminals'].forEach(fnName => {
    const original = window[fnName];
    if (typeof original === 'function') {
      window[fnName] = function (...args) {
        const res = original.apply(this, args);
        try {
          const map = {
            'loadRequests':'#requests-tbody',
            'loadSignals':'#signals-tbody',
            'loadTerminals':'#terminals-tbody'
          };
          const tb = qs(map[fnName]);
          if (tb) {
            tb.querySelectorAll('tr').forEach(tr => {
              if (!tr.querySelector('td')) tr.innerHTML = ensureTdCells(tr.innerHTML);
            });
          }
        } catch (e) {}
        return res;
      };
    }
  });

  // ---------- Form hook if base file uses a wrong id ----------
  (function hookForm() {
    const form = document.getElementById('request-form') || document.getElementById('new-request-form');
    if (form && !form.__ssto_patched) {
      form.__ssto_patched = true;
      form.addEventListener('submit', (e) => {
        // If the base file already defines submitRequest() — let it work
        if (form.id === 'request-form' && typeof window.submitRequest === 'function') return;
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const list = JSON.parse(localStorage.getItem('testRequests') || '[]');
        const id = data.id || ('REQ-' + Date.now());
        list.push({ ...data, id, status: data.status || 'pending' });
        localStorage.setItem('testRequests', JSON.stringify(list));
        alert('Заявка сохранена (PATCH).');
        try { if (typeof window.loadRequests === 'function') window.loadRequests(); } catch (e) {}
        showSection('requests');
      });
    }
  })();

  log('applied');
})(); 
