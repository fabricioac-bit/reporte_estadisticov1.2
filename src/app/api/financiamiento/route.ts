import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    mensaje: 'API de Financiamiento (SIS) lista para integracion',
    data: null
  });
}