import { NextRequest, NextResponse } from 'next/server';
import { TiemposConsultaExternaService } from '@/services/tiempos-consulta-externa.service';

export async function GET(request: NextRequest) {
  const service = new TiemposConsultaExternaService();

  try {
    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        { success: false, mensaje: 'Se requieren fechaInicio y fechaFin.' },
        { status: 400 }
      );
    }

    const data = await service.getTiemposConsultaExterna(fechaInicio, fechaFin);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, mensaje: error.message || 'Error al obtener indicadores.' },
      { status: 500 }
    );
  }
}