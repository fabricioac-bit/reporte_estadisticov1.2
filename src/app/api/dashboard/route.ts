import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';

export async function GET() {
  const dashboardService = new DashboardService();
  
  try {
    const resultado = await dashboardService.getDashboardData();
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