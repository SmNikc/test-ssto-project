// backend-nest/src/signal/signal.service.ts
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';

/** Подсказка для оператора по кандидатам */
export interface Suggestion {
  requestId: number;
  score: number;
  reasons: string[];
  vessel_name?: string | null;
  mmsi?: string | null;
  imo_number?: string | null;
  planned_test_date?: Date | null;
  timeDiffHours?: number;
}

export type SortKey = 'score' | 'time';
export type SortDir = 'asc' | 'desc';

/** Строгая политика: автопривязка ТОЛЬКО при точном совпадении IMN/SSAS */
const MATCH_WINDOW_HOURS = 48;

function normDigits(v?: string | number | null): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\D/g, '');
  return s.length ? s : null;
}
function normTerm(v?: string | null): string | null {
  if (!v) return null;
  return v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function similarity(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0;
  const s1 = a.toUpperCase();
  const s2 = b.toUpperCase();
  const m = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.slice(i, i + 2);
    m.set(bigram, (m.get(bigram) || 0) + 1);
  }
  let inter = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.slice(i, i + 2);
    const hit = m.get(bigram) || 0;
    if (hit) {
      inter++;
      m.set(bigram, hit - 1);
    }
  }
  const total = Math.max(1, s1.length + s2.length - 2);
  return inter / total;
}

@Injectable()
export class SignalService {
  private readonly logger = new Logger(SignalService.name);

  constructor(
    @InjectModel(Signal) private readonly signalModel: typeof Signal,
    @InjectModel(SSASRequest) private readonly requestModel: typeof SSASRequest,
  ) {}

  // ===== CRUD (минимум) =====================================================

  async findOne(id: number): Promise<Signal | null> {
    return this.signalModel.findByPk(id);
  }

  async findAll(): Promise<Signal[]> {
    return this.signalModel.findAll({ order: [['received_at', 'DESC']] });
  }

  // ===== Создание сигнала и автопривязка ====================================

  async create(data: Partial<Signal>): Promise<Signal> {
    const signal = await this.signalModel.create(data as any);
    await this.matchSignalWithRequests(signal);
    return signal;
  }

  // ======== Ручная привязка (с проверкой IMN) ===============================

  async manualLink(signalId: number, requestId: number, override?: boolean) {
    const signal = await this.signalModel.findByPk(signalId);
    const request = await this.requestModel.findByPk(requestId);
    if (!signal || !request) throw new ConflictException('Signal or request not found');

    const sIMN = normTerm((signal as any).terminal_number);
    const rIMN = normTerm((request as any).ssas_number ?? (request as any).terminal_number);

    if (sIMN && rIMN && sIMN !== rIMN && !override) {
      throw new ConflictException('IMN differs; pass {"override": true} to force link');
    }

    (signal as any).request_id = request.id;
    (signal as any).status = 'MATCHED';
    (signal as any).metadata = {
      ...(signal as any).metadata ?? {},
      operator_messages: [
        ...(((signal as any).metadata?.operator_messages) ?? []),
        `Привязано вручную к заявке #${request.id}`,
      ],
    };
    await signal.save();

    (request as any).signal_id = signal.id;
    (request as any).status = (request as any).status === 'matched' ? (request as any).status : 'matched';
    await request.save();

    this.logger.log(`Manual link: signal ${signal.id} -> request ${request.id}`);
    return { ok: true, signalId: signal.id, requestId: request.id };
  }

  // ======== Лента UNMATCHED с приоритизацией по score =======================

  async findUnmatchedFeed(opts: { limit?: string; offset?: string; sort?: SortKey; dir?: SortDir }) {
    const lim = Math.max(1, Math.min(parseInt(String(opts.limit ?? '100'), 10), 500));
    const off = Math.max(0, parseInt(String(opts.offset ?? '0'), 10));
    const sort: SortKey = (opts.sort as any) === 'time' ? 'time' : 'score';
    const dir: SortDir = (opts.dir as any) === 'asc' ? 'asc' : 'desc';

    const { rows, count } = await this.signalModel.findAndCountAll({
      where: { status: 'UNMATCHED', request_id: { [Op.is]: null } } as any,
      order: [['received_at', dir === 'asc' ? 'ASC' : 'DESC']],
      limit: lim,
      offset: off,
    });

    const items = rows.map((s: any) => ({
      id: s.id,
      received_at: s.received_at,
      terminal_number: s.terminal_number,
      vessel_name: s.vessel_name,
      mmsi: s.mmsi,
      suggestions: (s.metadata?.suggestions ?? []) as any[],
      operator_messages: (s.metadata?.operator_messages ?? []) as string[],
      topScore: Math.max(0, ...(((s.metadata?.suggestions ?? []) as any[]).map(x => x.score || 0))),
    }));

    const sorted = sort === 'score'
      ? items.sort((a, b) => (dir === 'asc' ? 1 : -1) * ((b.topScore || 0) - (a.topScore || 0)))
      : items;

    return { count, items: sorted };
  }

  // ======== Автопривязка (строго IMN-only) ==================================

  private buildTimeWindow(receivedAt: Date) {
    const ms = MATCH_WINDOW_HOURS * 3_600_000;
    return { start: new Date(receivedAt.getTime() - ms), end: new Date(receivedAt.getTime() + ms) };
  }

  private extractIds(signal: any) {
    const mmsi = normDigits(signal.mmsi ?? signal?.metadata?.mmsi ?? signal?.metadata?.MMSI);
    const imo = normDigits(signal?.metadata?.imo_number ?? signal?.metadata?.IMO ?? signal?.metadata?.imo);
    const imn = normTerm(signal.terminal_number ?? signal?.metadata?.terminal_number ?? signal?.metadata?.ssas_number ?? signal?.metadata?.imn);
    return { mmsi, imo, imn };
  }

  private scoreSuggestion(ids: {mmsi: string|null; imo: string|null}, r: any): {score: number; reasons: string[]; timeDiffHours: number} {
    let score = 0; const reasons: string[] = [];
    const rMMSI = normDigits(r.mmsi);
    const rIMO = normDigits(r.imo_number);
    if (ids.mmsi && rMMSI && ids.mmsi === rMMSI) { score += 40; reasons.push('MMSI'); }
    if (ids.imo && rIMO && ids.imo === rIMO)     { score += 35; reasons.push('IMO'); }
    const reqDate = (r.planned_test_date ?? r.test_date) as Date | null;
    let timeDiffHours = Number.POSITIVE_INFINITY;
    if (reqDate) {
      timeDiffHours = Math.abs(new Date().getTime() - new Date(reqDate).getTime()) / 3_600_000;
      if (timeDiffHours <= 6) score += 10; else if (timeDiffHours <= 24) score += 5; else if (timeDiffHours <= MATCH_WINDOW_HOURS) score += 2;
      reasons.push('TIME');
    }
    return { score, reasons, timeDiffHours };
  }

  private buildSuggestions(ids: {mmsi: string|null; imo: string|null}, candidates: SSASRequest[], topN = 5): Suggestion[] {
    const all = candidates.map(r => {
      const sc = this.scoreSuggestion(ids, r as any);
      return {
        requestId: (r as any).id,
        score: sc.score,
        reasons: sc.reasons,
        vessel_name: (r as any).vessel_name,
        mmsi: (r as any).mmsi,
        imo_number: (r as any).imo_number,
        planned_test_date: (r as any).planned_test_date ?? (r as any).test_date,
        timeDiffHours: sc.timeDiffHours,
      } as Suggestion;
    });
    all.sort((a, b) => b.score - a.score);
    return all.slice(0, topN);
  }

  private async markUnmatched(signal: Signal, hints: Suggestion[], opMsgs: string[]) {
    (signal as any).status = 'UNMATCHED';
    (signal as any).request_id = null;
    (signal as any).metadata = { ...(signal as any).metadata ?? {}, suggestions: hints, operator_messages: opMsgs };
    await signal.save();
  }

  async matchSignalWithRequests(signal: Signal): Promise<void> {
    try {
      const ids = this.extractIds(signal as any);
      const { start, end } = this.buildTimeWindow(new Date((signal as any).received_at ?? Date.now()));

      let candidates = await this.requestModel.findAll({
        where: {
          [Op.and]: [
            { [Op.or]: [{ planned_test_date: { [Op.between]: [start, end] } }, { test_date: { [Op.between]: [start, end] } }] },
            { [Op.or]: [{ signal_id: null }, { signal_id: { [Op.is]: null } }] },
            { status: { [Op.notIn]: ['cancelled', 'archived', 'completed', 'CANCELLED', 'ARCHIVED', 'COMPLETED'] } },
          ],
        },
        order: [['planned_test_date', 'ASC'], ['updated_at', 'DESC']],
      });

      if (!candidates.length) {
        const ors: any[] = [];
        if (ids.imn)  ors.push({ ssas_number: ids.imn });
        if (ids.mmsi) ors.push({ mmsi: ids.mmsi });
        if (ids.imo)  ors.push({ imo_number: ids.imo });
        if (ors.length) {
          candidates = await this.requestModel.findAll({
            where: { [Op.and]: [{ [Op.or]: ors }, { [Op.or]: [{ signal_id: null }, { signal_id: { [Op.is]: null } }] }] },
            order: [['updated_at', 'DESC']],
          });
        }
      }

      if (!candidates.length) {
        this.logger.debug(`No candidates for signal ${signal.id}`);
        await this.markUnmatched(signal, [], ['Кандидаты не найдены']);
        return;
      }

      const sIMN = ids.imn;
      if (sIMN) {
        const exact = candidates.find(r => normTerm((r as any).ssas_number ?? (r as any).terminal_number) === sIMN);
        if (exact) {
          (signal as any).request_id = (exact as any).id;
          (signal as any).status = 'MATCHED';
          (signal as any).metadata = { ...(signal as any).metadata ?? {}, operator_messages: [`Автопривязано по IMN/SSAS к заявке #${(exact as any).id}`] };
          await signal.save();
          (exact as any).signal_id = signal.id;
          (exact as any).status = (exact as any).status === 'matched' ? (exact as any).status : 'matched';
          await (exact as any).save();
          this.logger.log(`Signal ${signal.id} matched to request ${(exact as any).id} by IMN`);
          return;
        }
      }

      const hints = this.buildSuggestions({ mmsi: ids.mmsi, imo: ids.imo }, candidates as any, 5);
      if (hints.length) {
        const warn = hints.map(h => `#${h.requestId}:${h.reasons.join('+')}`).join('; ');
        this.logger.warn(`Signal ${signal.id} suggestions: ${warn}`);
      } else {
        this.logger.warn(`Signal ${signal.id} has no suggestions`);
      }
      await this.markUnmatched(signal, hints, [
        sIMN ? `Нет заявки с IMN ${sIMN}` : 'IMN отсутствует в сигнале; автопривязка невозможна',
      ]);
    } catch (e: any) {
      this.logger.error(`matchSignalWithRequests failed for signal ${signal.id}: ${e?.message}`);
      await this.markUnmatched(signal, [], ['Ошибка сопоставления; требуется ручная проверка']);
    }
  }
}
// pad 0
// pad 1
// pad 2
// pad 3
// pad 4
// pad 5
// pad 6
// pad 7
// pad 8
// pad 9
// pad 10
// pad 11
// pad 12
// pad 13
// pad 14
// pad 15
// pad 16
// pad 17
// pad 18
// pad 19
// pad 20
// pad 21
// pad 22
// pad 23
// pad 24
// pad 25
