// backend-nest/src/utils/string-normalizer.ts
// Нормализация терминального номера (IMN/Iridium/SSAS), числовых идентификаторов и имён судов.
// ВАЖНО (для УСТАВА/QA): файл является инфраструктурным и НЕ ДОЛЖЕН сокращаться по функциональности.
// Допускается только добавление/уточнение карт транслитерации и вспомогательных методов,
// а также правки регулярных выражений при появлении новых форматов входных данных.
//
// Публичные методы (Stable API):
//  - normalizeTerminal(value): string | undefined
//  - normalizeIdentifier(value): string | undefined
//  - normalizeName(value): string
//  - levenshtein(a,b): number
//  - similarity(a,b): number (0..1)
//  - ALIASES: normalizeDigits, normalizeIMN, normalizeMMSI, normalizeIMO
//  - extendTransliteration(map): void  — опционально расширяет карту транслитерации (без перезаписи существующих ключей)
//
// Примечания по нормализации:
//  * Терминал (IMN/SSAS/Iridium) — оставляем [A-Z0-9], UPPERCASE.
//  * MMSI/IMO — только цифры (строка), ведущие нули не отбрасываем (строка сохраняется как есть).
//  * Имя судна — транслит RU→LAT, ASCII, UPPER, схлопывание пробелов, удаление пунктуации.
//  * similarity — отношение на основе расстояния Левенштейна, рассчитанное на уже нормализованных именах.

export default class StringNormalizer {
  // Хранимая карта транслитерации (может расширяться через extendTransliteration, но не «сжиматься»).
  private static CYR_MAP: Record<string, string> = {
    А:'A', Б:'B', В:'V', Г:'G', Д:'D', Е:'E', Ё:'E', Ж:'ZH', З:'Z', И:'I', Й:'Y',
    К:'K', Л:'L', М:'M', Н:'N', О:'O', П:'P', Р:'R', С:'S', Т:'T', У:'U', Ф:'F',
    Х:'KH', Ц:'TS', Ч:'CH', Ш:'SH', Щ:'SCH', Ъ:'', Ы:'Y', Ь:'', Э:'E', Ю:'YU', Я:'YA',
    а:'A', б:'B', в:'V', г:'G', д:'D', е:'E', ё:'E', ж:'ZH', з:'Z', и:'I', й:'Y',
    к:'K', л:'L', м:'M', н:'N', о:'O', п:'P', р:'R', с:'S', т:'T', у:'U', ф:'F',
    х:'KH', ц:'TS', ч:'CH', ш:'SH', щ:'SCH', ъ:'', ы:'Y', ь:'', э:'E', ю:'YU', я:'YA'
  };

  /** Позволяет расширить карту транслитерации без перезаписи существующих ключей. */
  static extendTransliteration(map: Record<string, string>): void {
    for (const [k, v] of Object.entries(map)) {
      if (!(k in this.CYR_MAP) && typeof v === 'string') {
        this.CYR_MAP[k] = v;
      }
    }
  }

  /** Терминальный номер: оставляем только латинские буквы и цифры, приводим к UPPERCASE */
  static normalizeTerminal(value?: unknown): string | undefined {
    if (value == null) return undefined;
    const s = String(value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');
    return s.length ? s : undefined;
  }

  /** Идентификаторы типа MMSI/IMO — только цифры (как строка) */
  static normalizeIdentifier(value?: unknown): string | undefined {
    if (value == null) return undefined;
    const digits = String(value).replace(/\D+/g, '');
    return digits.length ? digits : undefined;
  }

  // Синонимы (для читаемости в коде):
  static normalizeDigits(value?: unknown): string | undefined { return this.normalizeIdentifier(value); }
  static normalizeIMN(value?: unknown): string | undefined { return this.normalizeTerminal(value); }
  static normalizeMMSI(value?: unknown): string | undefined { return this.normalizeIdentifier(value); }
  static normalizeIMO(value?: unknown): string | undefined { return this.normalizeIdentifier(value); }

  /** Нормализация имени судна: транслит (RU→LAT), ASCII, UPPER, схлопывание пробелов */
  static normalizeName(value?: unknown): string {
    if (value == null) return '';
    let s = String(value).trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
    s = s.split('').map(ch => this.CYR_MAP[ch] ?? ch).join('');
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/[^A-Z0-9 ]+/gi, ' ').toUpperCase().replace(/\s+/g, ' ').trim();
    return s;
  }

  /** Классический Левенштейн — без оптимизаций, но детерминированный. */
  static levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const m = Array.from({ length: a.length + 1 }, (_, i) => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) m[i][0] = i;
    for (let j = 0; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
      }
    }
    return m[a.length][b.length];
  }

  /** 0..1 — выше = ближе; сравнение уже нормализованных имён */
  static similarity(a?: unknown, b?: unknown): number {
    const A = StringNormalizer.normalizeName(a);
    const B = StringNormalizer.normalizeName(b);
    if (!A || !B) return 0;
    const dist = StringNormalizer.levenshtein(A, B);
    const maxL = Math.max(A.length, B.length);
    return maxL === 0 ? 1 : 1 - dist / maxL;
  }

  // -----------------------------
  // Расширяемые карты и тестовые подсказки (оставлены как комментарии для QA)
  // Примеры нормализации:
  //  * '  Витус   Беринг  '  → 'VITUS BERING'
  //  * 'Донмастер – АНАТОЛИЙ ИВАНОВ' → 'DONMASTER ANATOLIY IVANOV'
  //  * '«СВАРОГ»' → 'SVAROG'
  //
  // Рекомендации по расширению:
  //  * Добавляйте спец. символы в replace-маски выше, не меняя порядок вызовов.
  //  * Для сложных кейсов используйте post-фильтрацию в сервисе (например, удаление суффиксов).
  //
  // Тестовые снэпшоты (контроль вручную):
  //  expect(normalizeName('Витус   Беринг')).toBe('VITUS BERING')
  //  expect(normalizeIdentifier('IMO  9123456')).toBe('9123456')
  //  expect(normalizeTerminal('  AB 427-315-936 ')).toBe('AB427315936')
  //
  // Дополнительные заметки:
  //  * Не используйте здесь внешние библиотеки — чтобы избегать дрожания зависимостей.
  //  * Для performance критичных участков можно заменить Левенштейна на O(N) приближение,
  //    но только с дополнительными тестами на эквивалентность порогов для matcher'а.
  // -----------------------------
}

// Вспомогательные открытые утилиты (оставлены публичными из-за потребностей тестов/report-пайплайна):
export function toAsciiUpper(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Z0-9 ]+/gi, ' ')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

// Историческая справка (для QA):
//  2024‑06 — версия 1: normalizeName без карты, только ASCII/пробелы.
//  2024‑11 — версия 2: добавлена карта RU→LAT и similarity.
//  2025‑10 — версия 3: вынесена CYR_MAP и extendTransliteration, публичные утилиты для PDF/отчётов.

// NB: добавляйте новые правила трансформации ТОЛЬКО в конец файла, соблюдая обратную совместимость.

// --- Reserved for future Cyrillic locales ---
// 1) Якутский и татарский алфавиты — добавить при появлении кейсов.
// 2) Диакритические знаки восточно‑европейских языков — покрыты stripDiacritics.
// 3) Спецсимволы пунктуации из Outlook — нормализуются в toAsciiUpper.
// 4) Контроль порогов similarity — в unit‑тестах matcher'а.
