import { EmergenciaAtencionesRepository } from '@/repositories/emergencia-atenciones.repository';
import {
  RespuestaAtencionesEmergencia,
  AtencionEmergenciaKPIs,
  DatosGrafico,
  DatosTurno,
  FilaTablaServicio,
  ParamsFiltroAtenciones,
} from '@/types/emergencia-atenciones';

export class EmergenciaAtencionesService {
  private repository = new EmergenciaAtencionesRepository();

  /**
   * Procesa solicitud de atenciones en emergencia
   * Decide entre vista global o vista detallada por médicos
   */
  async obtenerAtencionesEmergencia(params: ParamsFiltroAtenciones): Promise<RespuestaAtencionesEmergencia> {
    const { fechaInicio, fechaFin, servicio, prioridad, turno } = params;

    // CASO INTERACTIVO: Filtro por servicio + prioridad + turno
    if (servicio !== 'Todos' && servicio !== '' && prioridad) {
      return this.obtenerVistaMedicos(
        fechaInicio,
        fechaFin,
        parseInt(servicio),
        prioridad,
        turno
      );
    }

    // CASO GLOBAL: Dashboard consolidado
    return this.obtenerVistaGlobal(fechaInicio, fechaFin, servicio);
  }

  /**
   * Vista global: Consolidado de todos los servicios con prioridades
   */
  private async obtenerVistaGlobal(
    fechaInicio: string,
    fechaFin: string,
    servicioSeleccionado: string
  ): Promise<RespuestaAtencionesEmergencia> {
    const filasReales = await this.repository.obtenerAtencionesGlobal(
      fechaInicio,
      fechaFin,
      servicioSeleccionado
    );

    // Cálculos de totales
    const granTotalReal = filasReales.reduce((acc, cur) => acc + (cur.TotalPacientes || 0), 0);
    const granTotalFugas = filasReales.reduce((acc, cur) => acc + (cur.TotalFugas || 0), 0);
    const granTotalAnulados = filasReales.reduce((acc, cur) => acc + (cur.TotalAnulados || 0), 0);

    const totalManana = filasReales.reduce((acc, cur) => acc + (cur.CargaManana || 0), 0);
    const totalTarde = filasReales.reduce((acc, cur) => acc + (cur.CargaTarde || 0), 0);
    const totalNoche = filasReales.reduce((acc, cur) => acc + (cur.CargaNoche || 0), 0);

    // Determine turno crítico
    let nombreTurnoCritico = 'Mañana';
    const maxGlobal = Math.max(totalManana, totalTarde, totalNoche);
    if (maxGlobal > 0) {
      if (maxGlobal === totalManana) nombreTurnoCritico = 'Mañana';
      else if (maxGlobal === totalTarde) nombreTurnoCritico = 'Tarde';
      else nombreTurnoCritico = 'Noche';
    }

    // KPIs
    const kpis: AtencionEmergenciaKPIs = {
      totalMes: granTotalReal,
      noAtendidos: granTotalFugas,
      eliminados: granTotalAnulados,
      turnoMayorDemanda: nombreTurnoCritico,
      altaEnServicio: granTotalReal,
      sinAlta: granTotalFugas,
    };

    // Datos para gráficos
    const graficoData: DatosGrafico[] = filasReales.map((row: any) => ({
      servicio: row.Servicio,
      idServicio: row.IdServicio,
      p1: row.p1 || 0,
      p2: row.p2 || 0,
      p3: row.p3 || 0,
      p4: row.p4 || 0,
      pacientes: row.TotalPacientes || 0,
    }));

    // Datos para gráfico de turnos
    const turnosData: DatosTurno[] = [
      { turno: 'Mañana', pacientes: totalManana },
      { turno: 'Tarde', pacientes: totalTarde },
      { turno: 'Noche', pacientes: totalNoche },
    ];

    // Tabla consolidada por servicio
    const tablaServicios: FilaTablaServicio[] = filasReales.map((row: any) => {
      const m = Number(row.CargaManana || 0);
      const t = Number(row.CargaTarde || 0);
      const n = Number(row.CargaNoche || 0);
      const ptsTotales = Number(row.TotalPacientes || 0);

      let turnoCriticoServicio = 'Sin registros';
      if (ptsTotales > 0) {
        const maxVal = Math.max(m, t, n);
        if (maxVal === m && m > 0) turnoCriticoServicio = 'Mañana';
        else if (maxVal === t && t > 0) turnoCriticoServicio = 'Tarde';
        else if (maxVal === n && n > 0) turnoCriticoServicio = 'Noche';
        else turnoCriticoServicio = nombreTurnoCritico;
      }

      return {
        id: row.IdServicio,
        servicio: row.Servicio,
        pacientes: ptsTotales,
        fugas: Number(row.TotalFugas || 0),
        anulados: Number(row.TotalAnulados || 0),
        turnoCritico: turnoCriticoServicio,
      };
    });

    return {
      kpis,
      grafico: graficoData,
      turnos: turnosData,
      tabla: tablaServicios,
      resumenDemanda: `Reporte de Gestión: Monitoreando ${granTotalReal} admisiones procesadas desde el ${fechaInicio} hasta el ${fechaFin}.`,
    };
  }

  /**
   * Vista detallada: Médicos por servicio, prioridad y turno
   */
  private async obtenerVistaMedicos(
    fechaInicio: string,
    fechaFin: string,
    idServicio: number,
    prioridad: string,
    turno: string = 'Todos'
  ): Promise<RespuestaAtencionesEmergencia> {
    const filasMedicos = await this.repository.obtenerMedicosPorServicioYPrioridad(
      fechaInicio,
      fechaFin,
      idServicio,
      prioridad,
      turno
    );

    // Totales dinámicos
    const totalPacientesServicio = filasMedicos.reduce((acc, cur) => acc + (cur.AtendidosReal || 0), 0);
    const totalFugasServicio = filasMedicos.reduce((acc, cur) => acc + (cur.FugasReal || 0), 0);
    const totalAnuladosServicio = filasMedicos.reduce((acc, cur) => acc + (cur.TotalAnulados || 0), 0);

    // KPIs
    const kpis: AtencionEmergenciaKPIs = {
      totalMes: totalPacientesServicio,
      noAtendidos: totalFugasServicio,
      eliminados: totalAnuladosServicio,
      turnoMayorDemanda: turno === 'Todos' ? 'Consolidado' : turno,
      altaEnServicio: totalPacientesServicio,
      sinAlta: totalFugasServicio,
    };

    // Gráfico
    const graficoData: DatosGrafico[] = [
      {
        servicio: filasMedicos[0]?.Servicio || 'Servicio',
        p1: totalPacientesServicio,
        p2: 0,
        p3: 0,
        p4: 0,
        pacientes: totalPacientesServicio,
      },
    ];

    // Turnos
    const turnosData: DatosTurno[] = [
      {
        turno: turno === 'Todos' ? 'Todos los Turnos' : turno,
        pacientes: totalPacientesServicio,
      },
    ];

    return {
      kpis,
      grafico: graficoData,
      turnos: turnosData,
      tabla: filasMedicos,
      resumenDemanda: `Reporte de Especialidad: Producción real en ${
        filasMedicos[0]?.Servicio || 'Tópico'
      } mostrando el rango [${turno === 'Todos' ? 'Todos los Turnos' : 'Turno ' + turno}] para la Prioridad ${prioridad}.`,
    };
  }
}
