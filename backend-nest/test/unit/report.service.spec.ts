import * as fs from 'node:fs';
import { inflateSync } from 'node:zlib';
import { ReportService } from '../../src/services/report.service';

describe('ReportService.generateTestConfirmation', () => {
  const reportService = new ReportService();

  const cleanupGenerated = (filePath: string) => {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  };

  it('renders mandatory MINTRANS/ROSMORRECHFLOT header for regulatory compliance', async () => {
    const filePath = await reportService.generateTestConfirmation(
      { id: 100, vessel_name: 'M/V TESTER', mmsi: '273123456' },
      { signal_type: 'TEST', vessel_name: 'M/V TESTER', mmsi: '273123456', received_at: new Date().toISOString() },
    );

    await new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (fs.existsSync(filePath)) {
          resolve();
          return;
        }
        if (Date.now() - started > 2000) {
          reject(new Error(`File ${filePath} was not created in time`));
          return;
        }
        setTimeout(check, 50);
      };
      check();
    });

    const buffer = fs.readFileSync(filePath);
    const binary = buffer.toString('binary');
    const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
    let match: RegExpExecArray | null;
    const decoded: string[] = [];

    // eslint-disable-next-line no-cond-assign
    while ((match = streamRegex.exec(binary))) {
      const chunk = Buffer.from(match[1], 'binary');
      try {
        decoded.push(inflateSync(chunk).toString('binary'));
      } catch {
        decoded.push(chunk.toString('binary'));
      }
    }

    const body = decoded.join('\n');
    expect(body).toContain('<41c41841d42242041041d4212042041e421421418418>');
    expect(body).toContain('<42041e42141c41e42042041542742441b41e422>');

    cleanupGenerated(filePath);
  });
});
