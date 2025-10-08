import * as fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import * as zlib from 'zlib';
import { ReportService } from '../../src/services/report.service';

describe('ReportService PDF соответствие нормативам', () => {
  const service = new ReportService();
  const createdFiles: string[] = [];

  afterAll(async () => {
    for (const file of createdFiles) {
      await fs.rm(file, { force: true });
    }
  });

  const waitForFile = async (filePath: string, timeoutMs = 2000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        await fs.access(filePath, fsConstants.F_OK);
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    throw new Error(`Файл ${filePath} не создан вовремя`);
  };

  const extractText = (buffer: Buffer) => {
    const textChunks: string[] = [];
    const marker = buffer.toString('latin1');
    let index = 0;
    while (true) {
      const streamIdx = marker.indexOf('stream', index);
      if (streamIdx === -1) break;
      const startIdx = marker.indexOf('\n', streamIdx);
      const endIdx = marker.indexOf('endstream', startIdx);
      if (startIdx === -1 || endIdx === -1) {
        break;
      }
      const raw = buffer.subarray(startIdx + 1, endIdx - 1);
      try {
        const inflated = zlib.inflateSync(raw);
        textChunks.push(inflated.toString('latin1'));
      } catch {
        textChunks.push(raw.toString('latin1'));
      }
      index = endIdx + 'endstream'.length;
    }
    return textChunks.join(' ');
  };

  it('формирует подтверждение с обязательными реквизитами (Приказ №115, письмо 29.05.2024)', async () => {
    const request = { id: 101, vessel_name: 'M/V TESTER' } as any;
    const signal = {
      mmsi: '273123456',
      vessel_name: 'M/V TESTER',
      signal_type: 'TEST',
      received_at: new Date('2024-09-01T10:00:00Z'),
    } as any;

    const filePath = await service.generateTestConfirmation(request, signal);
    createdFiles.push(filePath);
    await waitForFile(filePath);

    const buffer = await fs.readFile(filePath);
    const text = extractText(buffer);

    expect(text).toContain('<41c41841d42242041041d4212042041e421421418418>'); // МИНТРАНС РОССИИ
    expect(text).toContain('<42041e42141c41e42042041542742441b41e422>'); // РОСМОРРЕЧФЛОТ
    expect(text).toContain('<41e43f43544043044243843243d44b4392043443543644344043d44b4392041341c42141a426>'); // ГМСКЦ
    expect(text).toContain('<4d4d53493a20323733313233343536>'); // MMSI: 273123456
    expect(text).toContain('<42243843f2044143843343d43043b4303a20>'); // Тип сигнала
    expect(text).toContain('<54455354>'); // TEST
  });
});
