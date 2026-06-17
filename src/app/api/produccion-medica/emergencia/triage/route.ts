import { NextRequest, NextResponse } from 'next/server';
import { TriajeService } from '@/services/triaje.service';
import { ParamsTriaje } from '@/types/triaje';

const obtenerFechasObligatorias = () => {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');

  return {
    inicio: `${yyyy}-${mm}-01`,
    fin: `${yyyy}-${mm}-${dd}`,
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const paciente = searchParams.get('paciente') || undefined;
    const dniPaciente = searchParams.get('dniPaciente') || undefined;
    const servicio = searchParams.get('servicio') || undefined;

    const params: ParamsTriaje = {
      fechaInicio: fechaInicio ?? obtenerFechasObligatorias().inicio,
      fechaFin: fechaFin ?? obtenerFechasObligatorias().fin,
      paciente,
      dniPaciente,
      servicio,
    };

    const service = new TriajeService();
    const resultado = await service.obtenerDatosTriaje(params);
    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('❌ Error en API Triaje:', error.message);
    return NextResponse.json(
      { error: 'Error interno de base de datos', details: error.message },
      { status: 500 }
    );
  }
}
