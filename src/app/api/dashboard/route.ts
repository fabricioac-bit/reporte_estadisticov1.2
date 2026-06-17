import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';

export async function GET(request: NextRequest) {
  const dashboardService = new DashboardService();
  
  try {
    const { searchParams } = new URL(request.url);
    const anioParam = searchParams.get('anio');
    const mesParam = searchParams.get('mes');

    const anio = anioParam ? parseInt(anioParam, 10) : undefined;
    const mes = mesParam ? parseInt(mesParam, 10) : undefined;

    const resultado = await dashboardService.getDashboardData(anio, mes);
    return NextResponse.json(resultado.data);
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        mensaje: error.message || 'Error interno al procesar el panel estadístico.' 
      }, 
      { status: 500 }
    );
  }
}