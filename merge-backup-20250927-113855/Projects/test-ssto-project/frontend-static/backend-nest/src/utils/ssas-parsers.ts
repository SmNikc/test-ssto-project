// src/utils/ssas-parsers.ts
// Лёгкие аналоги parseISO и parse без внешних зависимостей и без именованных групп RegExp.
// Поддерживаем базовые форматы: 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm',
// 'dd.MM.yyyy', 'dd.MM.yyyy HH:mm', 'dd/MM/yyyy', 'dd/MM/yyyy HH:mm'.
// Если формат не распознан — пробуем new Date(dateString).

export function parseISO(input: string): Date {
  if (!input) return new Date(NaN);
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date(NaN) : d;
}

/**
 * Упрощённый аналог date-fns/parse (только нужные нам варианты).
 * @param dateString строка даты
 * @param format формат из поддерживаемого набора
 * @param _referenceDate не используется (для совместимости сигнатуры)
 */
export function parse(dateString: string, format: string, _referenceDate: Date): Date {
  if (!dateString || !format) return new Date(NaN);

  const toDate = (y: number, m: number, d: number, hh = 0, mm = 0, ss = 0) => {
    const dt = new Date(y, m - 1, d, hh, mm, ss, 0);
    return isNaN(dt.getTime()) ? new Date(NaN) : dt;
  };

  switch (format) {
    case 'yyyy-MM-dd': {
      const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateString);
      if (!m) break;
      return toDate(Number(m[1]), Number(m[2]), Number(m[3]));
    }
    case 'yyyy-MM-dd HH:mm': {
      const m = /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/.exec(dateString);
      if (!m) break;
      return toDate(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
    }
    case 'dd.MM.yyyy': {
      const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(dateString);
      if (!m) break;
      return toDate(Number(m[3]), Number(m[2]), Number(m[1]));
    }
    case 'dd.MM.yyyy HH:mm': {
      const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2})$/.exec(dateString);
      if (!m) break;
      return toDate(Number(m[3]), Number(m[2]), Number(m[1]), Number(m[4]), Number(m[5]));
    }
    case 'dd/MM/yyyy': {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateString);
      if (!m) break;
      return toDate(Number(m[3]), Number(m[2]), Number(m[1]));
    }
    case 'dd/MM/yyyy HH:mm': {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/.exec(dateString);
      if (!m) break;
      return toDate(Number(m[3]), Number(m[2]), Number(m[1]), Number(m[4]), Number(m[5]));
    }
    default:
      break;
  }

  // Фоллбек на встроенный парсер
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? new Date(NaN) : d;
}

// ---------------------------------------------------------------------------
// Парсеры SSAS-сообщений (экспортируются для тестов ssas-parsers.spec.ts)
// ---------------------------------------------------------------------------

export interface ParsedSsas {
  mmsi?: string;
  classification?: 'TEST' | 'ALERT';
  latitude?: number;
  longitude?: number;
  beacon_hex_id?: string;
}

const RE_MMSI = /\bMMSI\s*[:#]?\s*(\d{7,9})\b/i;
const RE_HEX  = /\bHEXID\s+([0-9A-F]+)\b/i;

// DMS координаты: допускаем секунды как 30" перед N/E, а также ' / ’ варианты.
const RE_DMS_LAT =
  /(\d{1,2})[°\s]\s*(\d{1,2})(?:[’']?\s*(\d{1,2}))?(?:["”])?\s*([NS])/i;
const RE_DMS_LON =
  /(\d{1,3})[°\s]\s*(\d{1,2})(?:[’']?\s*(\d{1,2}))?(?:["”])?\s*([EW])/i;

function dmsToDecimal(d: number, m: number, s: number | undefined, hemi: string): number {
  const sec = s ? Number(s) : 0;
  const sign = /[SW]/i.test(hemi) ? -1 : 1;
  return sign * (Number(d) + Number(m) / 60 + sec / 3600);
}

/** MMSI/класс/координаты из письма */
export function parseEmail(subject: string, body: string): ParsedSsas {
  const out: ParsedSsas = {};

  const mm = RE_MMSI.exec(subject) || RE_MMSI.exec(body);
  if (mm) out.mmsi = mm[1];

  const big = `${subject}\n${body}`.toUpperCase();
  out.classification = big.includes('TEST') ? 'TEST' : 'ALERT';

  const lat = RE_DMS_LAT.exec(body) || RE_DMS_LAT.exec(subject);
  const lon = RE_DMS_LON.exec(body) || RE_DMS_LON.exec(subject);
  if (lat && lon) {
    out.latitude  = dmsToDecimal(+lat[1], +lat[2], lat[3] ? +lat[3] : undefined, lat[4]);
    out.longitude = dmsToDecimal(+lon[1], +lon[2], lon[3] ? +lon[3] : undefined, lon[4]);
  }

  return out;
}

/** MMSI/HEXID + класс из «сырого» текста */
export function parseTextPayload(raw: string): ParsedSsas {
  const out: ParsedSsas = {};
  const mm = RE_MMSI.exec(raw);
  if (mm) out.mmsi = mm[1];

  const hx = RE_HEX.exec(raw);
  if (hx) out.beacon_hex_id = hx[1].toUpperCase();

  out.classification = raw.toUpperCase().includes('TEST') ? 'TEST' : 'ALERT';
  return out;
}
