// backend-nest/src/signal/signal-matcher.ts
// Автопривязка строго по терминальному номеру (IMN/Iridium/SSAS).
// MMSI/IMO/имя судна используются ТОЛЬКО для подсказок оператору.
// ВНИМАНИЕ (для УСТАВА): запрещено включать автопривязку по MMSI/IMO/NAME — только IMN.
//
// Публичные сущности:
//  - MATCH_WINDOW_HOURS (const)
//  - extractSignalIdentifiers(signal): SignalIdentifiers
//  - selectBestMatchStrictByTerminal(sig, candidates)
//  - buildSuggestions(sig, candidates, limit)
//  - buildOperatorMessages(sig, suggestions)
//  - Типы: SignalLike, RequestLike, SignalIdentifiers, Suggestion
//
// Изменения политики (история):
//  * 2025‑10 — введена строгая IMN‑only‑привязка и операционные подсказки (MMSI/IMO/NAME/TIME).
//  * 2024‑12..2025‑09 — весовые матчи по нескольким полям (устарели в связи с нормативами).

import StringNormalizer from '../utils/string-normalizer';

export const MATCH_WINDOW_HOURS = 48;

export type SignalLike = {
  id?: number;
  mmsi?: string | null;
  terminal_number?: string | null;   // IMN/SSAS/Iridium
  imo_number?: string | null;
  vessel_name?: string | null;
  received_at?: Date | null;
  signal_type?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type RequestLike = {
  id: number;
  vessel_name?: string | null;
  mmsi?: string | null;
  imo_number?: string | null;
  ssas_number?: string | null;       // терминал в заявке
  planned_test_date?: Date | string | null;
  test_date?: Date | string | null;
  status?: string | null;
  signal_id?: number | null;
};

export interface SignalIdentifiers {
  mmsi?: string;
  imo?: string;
  imn?: string;
  vesselName?: string;
  receivedAt: Date;
  isTestSignal: boolean;
}

export interface Suggestion {
  requestId: number;
  score: number;
  reasons: string[];     // MMSI/IMO/NAME/TIME
}

// Политика сопоставления (фиксируется в Уставе/README):
export interface MatcherPolicy {
  autoLink: 'IMN_ONLY';   // других значений быть не может
  suggestionSignals: Array<'MMSI'|'IMO'|'NAME'|'TIME'>;
  timeWindowHours: number;
}
export const DEFAULT_POLICY: MatcherPolicy = {
  autoLink: 'IMN_ONLY',
  suggestionSignals: ['MMSI','IMO','NAME','TIME'],
  timeWindowHours: MATCH_WINDOW_HOURS,
};

export function extractSignalIdentifiers(signal: SignalLike): SignalIdentifiers {
  const md = (signal.metadata ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = (md as any)[k];
      if (v != null && String(v).trim()) return String(v);
    }
    return undefined;
  };

  const imn  = StringNormalizer.normalizeTerminal(
    signal.terminal_number ??
    pick('terminal_number','terminalNumber','ssas_number','SSAS','inmarsat_number','iridium_number','imn','IMN','mobile_terminal_no')
  );
  const mmsi = StringNormalizer.normalizeIdentifier(signal.mmsi ?? pick('mmsi','MMSI'));
  const imo  = StringNormalizer.normalizeIdentifier(pick('imo','IMO','imo_number'));
  const vesselName = (signal.vessel_name ?? pick('vessel_name','vesselName','ship_name','shipName')) as string | undefined;

  const textBlob = [
    md['classification'], md['signal_type'], md['subject'], md['body'], md['text'], signal.signal_type
  ].filter(Boolean).map(String).join(' ').toUpperCase();
  const isTestSignal = /TEST|DRILL|УЧЕБ/.test(textBlob);

  return {
    imn: imn ?? undefined,
    mmsi: mmsi ?? undefined,
    imo:  imo ?? undefined,
    vesselName,
    receivedAt: (signal.received_at && !Number.isNaN(signal.received_at.getTime())) ? signal.received_at! : new Date(),
    isTestSignal,
  };
}

export function resolveRequestDate(req: RequestLike): Date | undefined {
  const candidates = [req.planned_test_date, req.test_date];
  for (const c of candidates) {
    if (!c) continue;
    if (c instanceof Date) return c;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

/** Автопривязка ТОЛЬКО по точному совпадению терминала. */
export function selectBestMatchStrictByTerminal(
  sig: SignalIdentifiers,
  candidates: RequestLike[],
): { request: RequestLike; timeDiffHours: number } | null {
  if (!sig.imn) return null;
  let best: { request: RequestLike; timeDiffHours: number } | null = null;

  for (const req of candidates) {
    const reqIMN = StringNormalizer.normalizeTerminal(req.ssas_number);
    if (!reqIMN || reqIMN !== sig.imn) continue;

    const d = resolveRequestDate(req);
    const diffH = d ? Math.abs(sig.receivedAt.getTime() - d.getTime()) / 3_600_000 : Number.POSITIVE_INFINITY;

    if (!best || diffH < best.timeDiffHours) {
      best = { request: req, timeDiffHours: diffH };
    }
  }
  return best;
}

/** Ранжирование подсказок (кандидатов) — без IMN, для UI/оператора. */
export function buildSuggestions(
  sig: SignalIdentifiers,
  candidates: RequestLike[],
  limit = 5,
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const req of candidates) {
    const reasons: string[] = [];
    let score = 0;

    const reqMMSI = StringNormalizer.normalizeIdentifier(req.mmsi);
    const reqIMO  = StringNormalizer.normalizeIdentifier(req.imo_number);

    if (sig.mmsi && reqMMSI && sig.mmsi === reqMMSI) { score += 40; reasons.push('MMSI'); }
    if (sig.imo  && reqIMO  && sig.imo  === reqIMO)  { score += 35; reasons.push('IMO'); }

    const sim = StringNormalizer.similarity(sig.vesselName, req.vessel_name);
    if (sim >= 0.90) { score += 25; reasons.push('NAME_STRONG'); }
    else if (sim >= 0.75) { score += Math.round(sim * 20); reasons.push('NAME_FUZZY'); }

    const d = resolveRequestDate(req);
    if (d) {
      const diffH = Math.abs(sig.receivedAt.getTime() - d.getTime()) / 3_600_000;
      const timeScore = diffH <= 6 ? 10 : diffH <= 24 ? 5 : diffH <= MATCH_WINDOW_HOURS ? 2 : 0;
      if (timeScore > 0) { score += timeScore; reasons.push('TIME'); }
    }

    if (score > 0) suggestions.push({ requestId: req.id, score, reasons });
  }

  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, limit);
}

/** Текстовые сообщения для оперативного дежурного по конкретному сигналу. */
export function buildOperatorMessages(sig: SignalIdentifiers, suggestions: Suggestion[]): string[] {
  const msgs: string[] = [];
  if (!sig.imn) {
    msgs.push('Автопривязка не выполнена: отсутствует терминальный номер IMN/SSAS в сигнале.');
  } else {
    msgs.push('Автопривязка не выполнена: в активных заявках нет заявки с таким IMN/SSAS.');
  }
  if (suggestions.length) {
    const top = suggestions.map(s => `#${s.requestId} · причины: ${s.reasons.join('+')} (score=${s.score})`).join('; ');
    msgs.push(`Возможные кандидаты для ручной привязки: ${top}`);
  } else {
    msgs.push('Подсказки не найдены: проверьте заявки по MMSI/IMO/названию и времени вручную.');
  }
  return msgs;
}

// NB: любые изменения алгоритма автопривязки требуют обновления документации и стратегий тестирования.
// См. docs/testing/*: планы и стратегия функционального тестирования модуля «Тест ССТО».
