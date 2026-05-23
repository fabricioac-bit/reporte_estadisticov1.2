import { NextResponse } from 'next/server';
import { ProductividadService } from '@/services/productividad.service';

export async function GET() {
  try {
    const service = new ProductividadService();
    const data = await service.getProductividadMensual();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, mensaje: 'Error al obtener productividad.' },
      { status: 500 }
    );
  }
}
