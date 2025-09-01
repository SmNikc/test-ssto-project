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
