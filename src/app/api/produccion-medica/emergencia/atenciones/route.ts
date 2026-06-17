import { NextRequest, NextResponse } from 'next/server';
import { EmergenciaAtencionesService } from '@/services/emergencia-atenciones.service';
import { ParamsFiltroAtenciones } from '@/types/emergencia-atenciones';

const obtenerFechasActuales = () => {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const diaHoy = String(ahora.getDate()).padStart(2, '0');

  return {
    inicio: `${anio}-${mes}-01`,
    fin: `${anio}-${mes}-${diaHoy}`,
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Obtener parámetros con valores por defecto
    let fechaInicio = searchParams.get('fechaInicio');
    let fechaFin = searchParams.get('fechaFin');
    const servicio = searchParams.get('servicio') || 'Todos';
    const prioridad = searchParams.get('prioridad');
    const turno = searchParams.get('turno') || 'Todos';

    // Automatizar fechas si no vienen completas
    if (!fechaInicio || !fechaFin || fechaInicio === 'null' || fechaFin === 'null') {
      const fechasActuales = obtenerFechasActuales();
      fechaInicio = fechasActuales.inicio;
      fechaFin = fechasActuales.fin;
    }

    // Validar fechas
    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: 'Fechas inválidas' },
        { status: 400 }
      );
    }

    // Preparar parámetros para el servicio
    const params: ParamsFiltroAtenciones = {
      fechaInicio,
      fechaFin,
      servicio,
      ...(prioridad && { prioridad }),
      ...(turno && turno !== 'Todos' && { turno }),
    };

    // Llamar al servicio
    const service = new EmergenciaAtencionesService();
    const resultado = await service.obtenerAtencionesEmergencia(params);

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('❌ Error en atenciones emergencia:', error.message);
    return NextResponse.json(
      { error: 'Error en el servidor de base de datos' },
      { status: 500 }
    );
  }
}