import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'APMS',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
