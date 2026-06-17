import { NextRequest, NextResponse } from 'next/server';
import { ProductividadConsultaService } from '@/services/productividad-consulta.service';

const formatearFecha = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const obtenerRangoDelMes = (mes: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(mes);

  if (!match) return null;

  const anio = Number(match[1]);
  const mesNumero = Number(match[2]);

  if (mesNumero < 1 || mesNumero > 12) return null;

  const fechaInicio = new Date(anio, mesNumero - 1, 1);
  const fechaFin = new Date(anio, mesNumero, 0);

  return {
    fechaInicio: formatearFecha(fechaInicio),
    fechaFin: formatearFecha(fechaFin),
  };
};

const obtenerDiasEntreFechas = (fechaInicio: string, fechaFin: string) => {
  const [anioInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
  const [anioFin, mesFin, diaFin] = fechaFin.split('-').map(Number);

  const inicio = new Date(anioInicio, mesInicio - 1, diaInicio);
  const fin = new Date(anioFin, mesFin - 1, diaFin);
  const dias: string[] = [];

  const actual = new Date(inicio);
  while (actual <= fin) {
    dias.push(String(actual.getDate()).padStart(2, '0'));
    actual.setDate(actual.getDate() + 1);
  }

  return dias;
};

const obtenerNumero = (valor: string | null) => {
  if (!valor || valor === 'Todos') return null;

  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
};

export async function GET(request: NextRequest) {
  const service = new ProductividadConsultaService();

  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const fechaInicioParam = searchParams.get('fechaInicio');
    const fechaFinParam = searchParams.get('fechaFin');

    const rangoMes = mes ? obtenerRangoDelMes(mes) : null;
    const fechaInicio = rangoMes?.fechaInicio || fechaInicioParam;
    const fechaFin = rangoMes?.fechaFin || fechaFinParam;

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        { success: false, mensaje: 'Se requiere fechaInicio y fechaFin.' },
        { status: 400 }
      );
    }

    if (mes && !rangoMes) {
      return NextResponse.json(
        { success: false, mensaje: 'El mes seleccionado no es válido.' },
        { status: 400 }
      );
    }

    if (fechaInicio > fechaFin) {
      return NextResponse.json(
        { success: false, mensaje: 'La fecha inicial debe ser menor o igual a la fecha final.' },
        { status: 400 }
      );
    }

    const turno = searchParams.get('turno');
    const filters = {
      departamentoId: obtenerNumero(searchParams.get('departamentoId')),
      especialidadId: obtenerNumero(searchParams.get('especialidadId')),
      medicoId: obtenerNumero(searchParams.get('medicoId')),
      turno: turno && turno !== 'Todos' ? turno : null,
    };

    const [anios, departamentos, especialidades, medicos, produccion, curva] = await Promise.all([
      service.getAniosDisponibles(),
      service.getDepartamentos(fechaInicio, fechaFin, filters),
      service.getEspecialidades(fechaInicio, fechaFin, filters),
      service.getMedicos(fechaInicio, fechaFin, filters),
      service.getProduccionConsultaExterna(fechaInicio, fechaFin, filters),
      service.getCurvaCargaPacientes(fechaInicio, fechaFin, filters),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        filtros: {
          anios,
          departamentos,
          especialidades,
          medicos,
        },
        produccion,
        curva,
        diasColumnas: obtenerDiasEntreFechas(fechaInicio, fechaFin),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, mensaje: error.message || 'Error al obtener productividad.' },
      { status: 500 }
    );
  }
}
