// backend-nest/src/utils/party-extractors.ts
// Утилиты извлечения контактных данных и владельца судна из текстов письма.
// НЕ обращаются к БД. Для fallback-владельца используйте уровень сервиса.

export interface PartyExtractResult {
  contact_person?: string | null;  // физлицо (подпись/роль+ФИО)
  contact_email?:  string | null;
  contact_phone?:  string | null;
  ship_owner?:     string | null;  // юрлицо (владелец/собственник), не оператор
}

const EMAIL_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

// Телефон: +CCC… , допускаем пробелы, дефисы, скобки
const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/g;

// Роли (физлицо) — расширяемый список
const ROLE_WORDS = [
  'Captain', 'Master', 'Chief Mate', '2nd Mate', '3rd Mate',
  'Radio Officer', 'ETO', 'Electro-technical Officer',
  'Safety Officer', 'Security Officer',

  'Капитан', 'Старший помощник', '2 помощник', '2-й помощник',
  '3 помощник', '3-й помощник', 'Радиооператор', 'Радио офицер',
  'Электромеханик', 'Ответственный по безопасности', 'Офицер безопасности',
];

// Триггеры владельца (юрлицо)
const OWNER_LABELS = [
  'owner', 'shipowner', 'beneficial owner', 'registered owner',
  'владелец', 'собственник',
];

// Триггеры оператора (НЕ владелец)
const OPERATOR_LABELS = [
  'operator', 'manager', 'doc holder',
  'оператор', 'менеджер', 'менеджер судна',
];

// Вспомогательные очистки
function cleanLine(s: string): string {
  return s.replace(/\u00A0/g, ' ')      // NBSP -> space
          .replace(/[ \t]+/g, ' ')
          .replace(/^[\s:;,-]+/, '')
          .replace(/[\s;,-]+$/, '')
          .trim();
}

function looksLikePerson(line: string): boolean {
  const hasRole = ROLE_WORDS.some(r => new RegExp(`\\b${r}\\b`, 'i').test(line));
  // простая эвристика «Фамилия И.О.»/«Имя Фамилия»
  const hasName = /\b([A-ZА-ЯЁ][a-zа-яё]+(?:\s+[A-ZА-ЯЁ][a-zа-яё]+){0,2}(?:\s+[A-ZА-ЯЁ]\.){0,2})\b/.test(line);
  return hasRole || hasName;
}

export function extractContactEmail(text: string): string | null {
  const m = EMAIL_RE.exec(text);
  EMAIL_RE.lastIndex = 0;
  return m ? m[1] : null;
}

export function extractContactPhone(text: string): string | null {
  const m = PHONE_RE.exec(text);
  PHONE_RE.lastIndex = 0;
  if (!m) return null;
  // немножко нормализации: уберём двойные пробелы
  return cleanLine(m[1]);
}

export function extractContactPerson(subject: string, body: string): string | null {
  const lines = (subject + '\n' + body)
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  // чаще подпись внизу — просмотрим с конца 12 строк
  const tail = lines.slice(-12);
  for (const ln of tail) {
    if (looksLikePerson(ln)) return ln;
  }

  // fallback: первая строка с ролью в любом месте
  for (const ln of lines) {
    if (looksLikePerson(ln)) return ln;
  }
  return null;
}

function lineContainsWord(line: string, words: string[]): boolean {
  return words.some(w => new RegExp(`\\b${w}\\b`, 'i').test(line));
}

export function extractShipOwner(subject: string, body: string): string | null {
  // ищем «Owner/Владелец: Компания …»
  const lines = (subject + '\n' + body)
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  // Не перепутать с оператором: если в строке есть слово из OPERATOR — пропускаем
  for (const ln of lines) {
    if (lineContainsWord(ln, OWNER_LABELS) && !lineContainsWord(ln, OPERATOR_LABELS)) {
      // Вырежем маркер и возьмём правую часть
      const after = ln.replace(/.*?\b(owner|shipowner|beneficial owner|registered owner|владелец|собственник)\b[:\-–]?\s*/i, '');
      // убрать кавычки
      const cleaned = after.replace(/^["'«]+/, '').replace(/["'»]+$/, '').trim();
      if (cleaned && cleaned.length >= 2) return cleaned;
    }
  }

  // Иногда пишут на отдельной строке без «:» — эвристика
  for (let i = 0; i < lines.length - 1; i++) {
    const ln = lines[i];
    if (lineContainsWord(ln, OWNER_LABELS) && !lineContainsWord(ln, OPERATOR_LABELS)) {
      const next = lines[i + 1];
      if (next && !looksLikePerson(next)) {
        return next.replace(/^["'«]+/, '').replace(/["'»]+$/, '').trim();
      }
    }
  }
  return null;
}

/**
 * Высокоуровневая функция: извлекает контактные данные и владельца.
 * Возвращает только то, что удалось распознать (остальные поля = null).
 */
export function extractParties(subject: string, body: string): PartyExtractResult {
  const contact_person = extractContactPerson(subject, body);
  const contact_email  = extractContactEmail(subject + '\n' + body);
  const contact_phone  = extractContactPhone(subject + '\n' + body);
  const ship_owner     = extractShipOwner(subject, body);

  return {
    contact_person: contact_person || null,
    contact_email : contact_email  || null,
    contact_phone : contact_phone  || null,
    ship_owner    : ship_owner     || null,
  };
}
