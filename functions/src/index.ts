import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

initializeApp();

interface ReportRequest {
  period: string;
  start: string;
  end: string;
  currency: string;
  ownerId: string;
}

interface ReportRow {
  date: string;
  reason: string;
  type: 'income' | 'expense';
  amount: number;
}

interface Totals {
  income: number;
  expense: number;
  net: number;
  count: number;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function buildPdf(opts: { period: string; currency: string; rows: ReportRow[]; totals: Totals }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const col = [40, 200, 330, 470];

    doc.fontSize(22).font('Helvetica-Bold').text('LEDGER REPORT');
    doc.fontSize(10).font('Helvetica').fillColor('#444444');
    doc.text(`Period: ${opts.period.toUpperCase()}    Currency: ${opts.currency}`);
    doc.text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown();
    doc.fillColor('#000000');

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`INCOME   ${opts.currency} ${fmt(opts.totals.income)}`);
    doc.text(`EXPENSE  ${opts.currency} ${fmt(opts.totals.expense)}`);
    doc.text(`NET      ${opts.currency} ${fmt(opts.totals.net)}`);
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1).stroke();
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('DATE', col[0], doc.y, { continued: true, width: col[1] - col[0] });
    doc.text('REASON', col[1], doc.y, { continued: true, width: col[2] - col[1] });
    doc.text('TYPE', col[2], doc.y, { continued: true, width: col[3] - col[2] });
    doc.text('AMOUNT', col[3], doc.y);
    doc.moveDown(0.4);
    doc.font('Helvetica');

    for (const r of opts.rows) {
      if (doc.y > 740) doc.addPage();
      doc.text(r.date, col[0], doc.y, { continued: true, width: col[1] - col[0] });
      doc.text((r.reason || (r.type === 'income' ? 'Income' : 'Expense')).slice(0, 38), col[1], doc.y, {
        continued: true,
        width: col[2] - col[1],
      });
      doc.text(r.type.toUpperCase(), col[2], doc.y, { continued: true, width: col[3] - col[2] });
      doc.text(`${r.type === 'income' ? '+' : '-'}${fmt(r.amount)}`, col[3], doc.y);
      doc.moveDown(0.3);
    }

    if (opts.rows.length === 0) {
      doc.moveDown();
      doc.fontSize(11).text('No transactions in this period.');
    }

    doc.end();
  });
}

export const generateReportPdf = onCall(
  {
    region: 'us-central1',
    // Public endpoint (no auth). Restrict with App Check / allowlist in production.
    cors: true,
  },
  async (request) => {
    const data = request.data as Partial<ReportRequest>;
    if (!data.ownerId || !data.period || !data.start || !data.end) {
      throw new HttpsError('invalid-argument', 'Missing required report parameters.');
    }

    const req: ReportRequest = {
      period: data.period,
      start: data.start,
      end: data.end,
      currency: data.currency || 'INR',
      ownerId: data.ownerId,
    };

    const db = getFirestore();
    const snap = await db
      .collection('owners')
      .doc(req.ownerId)
      .collection('transactions')
      .where('date', '>=', req.start)
      .where('date', '<=', req.end)
      .orderBy('date', 'desc')
      .get();

    const rows: ReportRow[] = [];
    const totals: Totals = { income: 0, expense: 0, net: 0, count: 0 };
    for (const d of snap.docs) {
      const t = d.data() as ReportRow;
      rows.push({ date: t.date, reason: t.reason, type: t.type, amount: t.amount });
      if (t.type === 'income') totals.income += t.amount;
      else totals.expense += t.amount;
      totals.count += 1;
    }
    totals.net = totals.income - totals.expense;

    const buffer = await buildPdf({ period: req.period, currency: req.currency, rows, totals });

    const bucket = getStorage().bucket();
    const fileName = `reports/${req.ownerId}/${req.period}-${Date.now()}.pdf`;
    const file = bucket.file(fileName);
    await file.save(buffer, { metadata: { contentType: 'application/pdf' } });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });

    return { url };
  }
);
