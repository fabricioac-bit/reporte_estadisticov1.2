import { TriajeRepository } from '@/repositories/triaje.repository';
import { ParamsTriaje, TriajeKPIs, TriajeResponse, TriajeTablaItem } from '@/types/triaje';

export class TriajeService {
  private repository = new TriajeRepository();

  private obtenerFechasMesActual() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');

    return {
      inicio: `${yyyy}${mm}01`,
      fin: `${yyyy}${mm}${dd}`,
    };
  }

  private normalizarFecha(fecha: string | null): string | null {
    if (!fecha) return null;
    const limpio = fecha.replace(/-/g, '');
    return limpio;
  }

  private esFiltroInicioDesdeEnero(fechaInicio: string): boolean {
    return fechaInicio.endsWith('0101') || fechaInicio === '20260106' || fechaInicio === '20260123';
  }

  private mapearTabla(registros: any[]): TriajeTablaItem[] {
    return registros.map((row: any, index: number) => ({
      id: index + 1,
      paciente: row.Paciente ?? `PACIENTE EVALUADO SIGH #${index + 1}`,
      dniPaciente: row.DniPaciente ?? 'N/A',
      areaTriaje: row.AreaTriaje ?? 'NO ESPECIFICADO',
      fechaTriaje: row.FechaTriaje ?? 'N/A',
      horaTriaje: row.HoraTriaje ?? 'N/A',
      talla: Number(row.TriajeTalla),
      peso: Number(row.TriajePeso),
      imc: Number(row.IMC),
      estadoNutricional: row.EstadoNutricional,
    }));
  }

  async obtenerDatosTriaje(params: ParamsTriaje): Promise<TriajeResponse> {
    const fechasDefault = this.obtenerFechasMesActual();
    const fechaInicioRaw = this.normalizarFecha(params.fechaInicio);
    const fechaFinRaw = this.normalizarFecha(params.fechaFin);

    let fechaInicio = fechaInicioRaw;
    let fechaFin = fechaFinRaw;

    if (!fechaInicio || !fechaFin || this.esFiltroInicioDesdeEnero(fechaInicio)) {
      fechaInicio = fechasDefault.inicio;
      fechaFin = fechasDefault.fin;
    }

    const registros = await this.repository.obtenerRegistrosTriaje({
      ...params,
      fechaInicio,
      fechaFin,
    });
    const kpis: TriajeKPIs = {
      totalMes: registros.length,
      delgado: 0,
      normal: 0,
      sobrepeso: 0,
      obesidadTotal: 0,
    };

    registros.forEach((row) => {
      switch (row.EstadoNutricional) {
        case 'Delgado':
          kpis.delgado += 1;
          break;
        case 'Normal':
          kpis.normal += 1;
          break;
        case 'Sobrepeso':
          kpis.sobrepeso += 1;
          break;
        case 'Obesidad I':
        case 'Obesidad II':
        case 'Obesidad III':
          kpis.obesidadTotal += 1;
          break;
      }
    });

    const grafico = [
      { estado: 'Delgado', pacientes: kpis.delgado },
      { estado: 'Normal', pacientes: kpis.normal },
      { estado: 'Sobrepeso', pacientes: kpis.sobrepeso },
      { estado: 'Obesidad I', pacientes: registros.filter((row) => row.EstadoNutricional === 'Obesidad I').length },
      { estado: 'Obesidad II', pacientes: registros.filter((row) => row.EstadoNutricional === 'Obesidad II').length },
      { estado: 'Obesidad III', pacientes: registros.filter((row) => row.EstadoNutricional === 'Obesidad III').length },
    ];

    let tabla = this.mapearTabla(registros);
    if (params.estadoNutricional && params.estadoNutricional !== 'Todos') {
      tabla = tabla.filter((item) => item.estadoNutricional.toLowerCase() === params.estadoNutricional!.toLowerCase());
    }

    return {
      periodoMostrado: {
        desde: fechaInicio,
        hasta: fechaFin,
      },
      kpis,
      grafico,
      tabla,
    };
  }
}
