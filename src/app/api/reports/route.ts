import { NextRequest, NextResponse } from 'next/server';
import { generateExcelReport, generatePDFReport, generateCSVReport } from '@/lib/actions/reports';

const VALID_TYPES = [
  'employee-statement', 'custody-statement', 'monthly-settlement',
  'outstanding-advances', 'missing-documents', 'subscription-report',
  'investment-report', 'executive-summary',
] as const;

type ReportType = typeof VALID_TYPES[number];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') as ReportType;
  const format = searchParams.get('format') ?? 'excel';

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  }

  try {
    if (format === 'pdf') {
      const buffer = await generatePDFReport(type);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${type}.pdf"`,
        },
      });
    }
    if (format === 'csv') {
      const csv = await generateCSVReport(type);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}.csv"`,
        },
      });
    }
    const buffer = await generateExcelReport(type);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
