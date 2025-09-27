// backend-nest/scripts/stress-signal-number.js
// Потокобезопасная проверка уникальности signal_number с авто-учётом реальной схемы signals.
// Учитывает camelCase-колонки (createdAt/updatedAt и пр.) — такие имена цитируются в SQL.
// Запуск: node backend-nest/scripts/stress-signal-number.js 100

const { Client } = require('pg');
const crypto = require('crypto');

const N = Number(process.argv[2] || 50);
function nowISO() { return new Date().toISOString(); }

// Базовые значения (если колонка существует)
function defaultValues(i) {
  const ts = nowISO();
  const body = `Synthetic signal #${i} at ${ts}`;
  return {
    mmsi: `273${String(500000 + i).padStart(6, '0')}`,
    signal_type: 'EMAIL',            // если есть такая колонка (text/enum)
    signal_kind: 'TEST',             // если ENUM — подберём допустимое
    received_at: ts,
    source_uid: `MAIL-UID-${Date.now()}-${i}`,
    signal_hash: crypto.createHash('sha256').update(body).digest('hex'),
    status: 'UNMATCHED',             // если ENUM — подберём допустимое
    // Системные штампы — на случай NOT NULL без DEFAULT
    created_at: ts, updated_at: ts,
    createdAt: ts, updatedAt: ts
  };
}

const EXCLUDE_COLS = new Set([
  'id',              // PK
  'signal_number'    // выставляет триггер next_signal_number()
]);

// Имя требует кавычек, если не полностью из [a-z0-9_]
const NEED_QUOTE_RE = /[^a-z0-9_]/;

function quoteIdent(name) {
  return NEED_QUOTE_RE.test(name) ? `"${name.replace(/"/g, '""')}"` : name;
}

async function readColumns(client) {
  const res = await client.query(`
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='signals'
  `);
  const map = new Map();
  for (const r of res.rows) {
    map.set(r.column_name, {
      name: r.column_name,
      data_type: (r.data_type || '').toLowerCase(),
      udt_name: r.udt_name || null,
      is_nullable: r.is_nullable === 'YES',
      column_default: r.column_default || null
    });
  }
  return map;
}

async function readEnumLabels(client, enumTypeName) {
  const res = await client.query(`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = $1
    ORDER BY e.enumsortorder
  `, [enumTypeName]);
  return res.rows.map(r => r.enumlabel);
}

function pickEnumPreferred(labels, columnDefault, preferList) {
  for (const pref of preferList) {
    const hit = labels.find(l => l.toLowerCase() === pref.toLowerCase());
    if (hit) return hit;
  }
  if (columnDefault) {
    const m = /'([^']+)'::/i.exec(columnDefault);
    if (m) {
      const hit = labels.find(l => l.toLowerCase() === m[1].toLowerCase());
      if (hit) return hit;
    }
  }
  return labels[0] || null;
}

function fallbackValueByType(col, enumChoice) {
  const t = col.data_type || '';
  if (t.includes('user-defined')) return enumChoice || 'UNKNOWN';
  if (t.includes('timestamp') || t.includes('time') || t.includes('date')) return nowISO();
  if (t.includes('character') || t.includes('text')) return 'N/A';
  if (t.includes('boolean')) return false;
  if (t.includes('integer') || t.includes('smallint') || t.includes('bigint')) return 0;
  if (t.includes('numeric') || t.includes('decimal') || t.includes('double') || t.includes('real')) return 0;
  if (t.includes('json')) return '{}';
  return 'N/A';
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'ssto',
    password: process.env.DB_PASSWORD || 'sstopass',
    database: process.env.DB_NAME || 'sstodb',
  });
  await client.connect();

  try {
    const colMeta = await readColumns(client);
    if (colMeta.size === 0) throw new Error("Не удалось прочитать колонки таблицы 'signals'");

    const realCols = [...colMeta.keys()].filter(n => !EXCLUDE_COLS.has(n));
    const requiredCols = [...colMeta.values()]
      .filter(c => !c.is_nullable && !c.column_default && !EXCLUDE_COLS.has(c.name))
      .map(c => c.name);

    const preferredOrder = [
      'mmsi',
      'signal_type',
      'signal_kind',
      'received_at',
      'source_uid',
      'signal_hash',
      'status',
      // email/письменные поля, если у вас они обязательные
      'beacon_hex_id', 'detection_time',
      'email_subject', 'email_body', 'email_from', 'email_received_at',
      // системные штампы (snake_case и camelCase — поддержим оба)
      'created_at','updated_at','createdAt','updatedAt'
    ];
    const finalColsSet = new Set(
      [...preferredOrder, ...requiredCols].filter(c => realCols.includes(c))
    );

    // ENUM-поля — подберём допустимые метки
    if (finalColsSet.has('signal_kind')) {
      const meta = colMeta.get('signal_kind');
      if (meta && meta.data_type === 'user-defined' && meta.udt_name) {
        const labels = await readEnumLabels(client, meta.udt_name);
        const choice = pickEnumPreferred(labels, meta.column_default, [
          'TEST','REAL','UNKNOWN','FALSE'
        ]);
        if (choice) defaultValues._signal_kind_choice = choice;
        else finalColsSet.delete('signal_kind');
      }
    }
    if (finalColsSet.has('status')) {
      const meta = colMeta.get('status');
      if (meta && meta.data_type === 'user-defined' && meta.udt_name) {
        const labels = await readEnumLabels(client, meta.udt_name);
        const choice = pickEnumPreferred(labels, meta.column_default, [
          'UNMATCHED','MATCHED','NEW','UNKNOWN'
        ]);
        if (choice) defaultValues._status_choice = choice;
        else finalColsSet.delete('status');
      }
    }

    if (finalColsSet.size === 0) {
      throw new Error("После фильтрации не осталось колонок для вставки");
    }

    function buildParams(i) {
      const dv = defaultValues(i);
      if (defaultValues._signal_kind_choice) dv.signal_kind = defaultValues._signal_kind_choice;
      if (defaultValues._status_choice) dv.status = defaultValues._status_choice;

      const params = [];
      for (const colName of finalColsSet) {
        const meta = colMeta.get(colName);
        let val = (dv[colName] !== undefined) ? dv[colName] : null;

        if (val === null) {
          const must = requiredCols.includes(colName);
          if (must) {
            let enumVal = null;
            if (meta && meta.data_type === 'user-defined' && meta.udt_name) {
              enumVal = defaultValues._status_choice || defaultValues._signal_kind_choice || 'UNKNOWN';
            }
            val = fallbackValueByType(meta, enumVal);
          } else {
            val = null;
          }
        }
        params.push(val);
      }
      return params;
    }

    const cols = [...finalColsSet];
    const colsSql = cols.map(quoteIdent);  // <-- ЦИТИРУЕМ нестандартные имена (createdAt и т.п.)
    const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
    const sql = `
      INSERT INTO signals (${colsSql.join(', ')})
      VALUES (${placeholders})
      RETURNING id, signal_number
    `;

    const tasks = [];
    for (let i = 0; i < N; i++) {
      const params = buildParams(i);
      tasks.push(
        client.query(sql, params)
          .then(r => r.rows[0])
          .catch(e => ({ error: e.message, params }))
      );
    }

    const inserted = await Promise.all(tasks);

    const numbers = [];
    const errors = [];
    for (const row of inserted) {
      if (row && row.error) {
        errors.push(row);
        continue;
      }
      if (!row) {
        errors.push({ error: 'unknown insert failure' });
        continue;
      }
      if (row.signal_number) numbers.push(row.signal_number);
    }

    if (errors.length) {
      console.error('❌ Ошибки при вставке некоторых записей:');
      errors.slice(0, 5).forEach((e, idx) => {
        console.error(`  [${idx + 1}] ${e.error}`);
        if (e.params) {
          const sample = cols.map((c, i) => `${c}=${JSON.stringify(e.params[i])}`).join(', ');
          console.error(`      cols: ${sample}`);
        }
      });
      if (errors.length > 5) console.error(`  ... ещё ${errors.length - 5} ошибок`);
      console.error('\n[Diag] NOT NULL без DEFAULT:', requiredCols.join(', ') || '(нет)');
      console.error('[Diag] Вставляемые колонки:', cols.join(', ') || '(нет)');
      process.exitCode = 1;
      return;
    }

    const set = new Set(numbers);
    console.log(`Вставлено сигналов: ${inserted.length}`);
    console.log(`Получено signal_number: ${numbers.length}`);
    console.log(`Уникальных signal_number: ${set.size}`);
    if (numbers.length !== set.size) {
      console.error('❌ Найдены дубликаты signal_number (память).');
      process.exitCode = 1;
    } else if (numbers.length === 0) {
      console.warn('⚠️  БД вернула 0 номеров (проверьте триггер trg_signals_signal_number).');
      process.exitCode = 1;
    } else {
      console.log('Примеры номеров:', numbers.slice(0, 5).join(', '));
      console.log('✅ Дубликатов не обнаружено.');
    }

  } catch (e) {
    console.error('❌ Ошибка стресс-скрипта сигналов:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

main();
