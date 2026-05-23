import { NextResponse } from 'next/server';
import { ReportesService } from '@/services/reportes.service';

export async function GET() {
  try {
    const service = new ReportesService();
    const data = await service.getDashboardKpis();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, mensaje: 'Error al obtener reportes.' },
      { status: 500 }
    );
  }
}
