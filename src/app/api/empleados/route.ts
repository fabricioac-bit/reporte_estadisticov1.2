import { NextResponse } from 'next/server';
import { EmpleadosService } from '@/services/empleados.service';

export async function GET() {
  try {
    const service = new EmpleadosService();
    const count = await service.getEmpleadosActivosCount();
    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, mensaje: 'Error al obtener recuento de empleados.' },
      { status: 500 }
    );
  }
}
