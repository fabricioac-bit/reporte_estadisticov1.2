import { 
  DashboardRepository, 
  MensualRaw,
  RendimientoServicioRaw,
  FinanciamientoServicioRaw
} from '../repositories/dashboard.repository';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();
  private todosLosMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  async getDashboardData(anio?: number, mes?: number) {
    try {
      const fechaActual = new Date();
      const anioActual = anio || fechaActual.getFullYear();
      const mesActual = mes || fechaActual.getMonth() + 1;

      // Consumo en paralelo de todas las consultas
      const [
        kpisRaw,
        rendimientoRaw,
        emergenciaRaw,
        horasRaw,
        rendimientoUnificadoRaw,
        financiamientoRaw
      ] = await Promise.all([
        this.dashboardRepository.getKpisGlobales(anioActual, mesActual),
        this.dashboardRepository.getRendimientoMensual(anioActual, mesActual),
        this.dashboardRepository.getRendimientoEmergencia(anioActual, mesActual),
        this.dashboardRepository.getDemandaPorHoras(anioActual),
        this.dashboardRepository.getRendimientoUnificado(anioActual, mesActual),
        this.dashboardRepository.getFinanciamientoPorServicio(anioActual, mesActual)
      ]);

      // Control preventivo si kpisRaw viene null o vacío de la BD
      const kpis = kpisRaw || {};

      // Función matemática para calcular tendencia
      const calcularTendencia = (actual: number, anterior: number): number => {
        if (!anterior || anterior === 0) return 0;
        return parseFloat((((actual - anterior) / anterior) * 100).toFixed(1));
      };

      // FORMATEADOR 1: Meses dinámicos para gráfico CE
      const mesesParaMostrar = this.todosLosMeses.slice(0, mesActual);
      const rendimientoMensualFormateado = mesesParaMostrar.map((mesNombre, indice) => {
        const mesNumero = indice + 1;
        const registro = rendimientoRaw.find((r: MensualRaw) => r.MesNum === mesNumero);
        return {
          mes: mesNombre,
          cantidad: registro ? registro.Cantidad : 0
        };
      });

      // FORMATEADOR 2: Meses dinámicos para gráfico Emergencia
      const emergenciaMensualFormateado = mesesParaMostrar.map((mesNombre, indice) => {
        const mesNumero = indice + 1;
        const registro = emergenciaRaw.find((r: MensualRaw) => r.MesNum === mesNumero);
        return {
          mes: mesNombre,
          cantidad: registro ? registro.Cantidad : 0
        };
      });

      // FORMATEADOR 3: Horas para gráfico de demanda
      const horasEje = Array.from({ length: 15 }, (_, i) => i + 6);
      const historialQuirurgicoFormateado = horasEje.map(hora => {
        const registro = horasRaw.find((h: MensualRaw) => h.MesNum === hora);
        return {
          mes: `${hora.toString().padStart(2, '0')}:00`,
          cantidad: registro ? registro.Cantidad : 0
        };
      });

      // FORMATEADOR 4: Gráfico unificado por servicio
      const servicios = [
        { id: 1, nombre: 'CE' },
        { id: 2, nombre: 'Emergencia' },
        { id: 3, nombre: 'Hospitalización' },
      ];

      const rendimientoPorServicio: Record<string, Array<{
        mes: string;
        atendidos: number;
        noAtendidos: number;
        eliminados: number;
      }>> = {};

      servicios.forEach(servicio => {
        rendimientoPorServicio[servicio.nombre] = mesesParaMostrar.map((mesNombre, indice) => {
          const mesNumero = indice + 1;
          const registro = rendimientoUnificadoRaw.find(
            (r: RendimientoServicioRaw) => r.IdTipoServicio === servicio.id && r.MesNum === mesNumero
          );
          return {
            mes: mesNombre,
            atendidos: registro?.Cant_Atendidos || 0,
            noAtendidos: registro?.Cant_NoAtendidos || 0,
            eliminados: registro?.Cant_Eliminadas || 0,
          };
        });
      });

      // FORMATEADOR 5: Gráfico financiamiento por servicio (CORREGIDO)
      const financiamientoPorServicio: Record<string, Array<{
        fuente: string;
        atendidos: number;
      }>> = {};

      servicios.forEach(servicio => {
        const registros = financiamientoRaw.filter(
          (f: FinanciamientoServicioRaw) => f.IdTipoServicio === servicio.id
        );
        // Aquí removimos Cant_NoAtendidos y Cant_Eliminadas porque tu query original no las extrae
        financiamientoPorServicio[servicio.nombre] = registros.map(r => ({
          fuente: r.NombreFuente,
          atendidos: r.Cant_Atendidos
        }));
      });

      return {
        success: true,
        data: {
          kpis: {
            // CE
            consultas_medicas: kpis.ConsultasMesActual || 0,
            consultas_tendencia: calcularTendencia(kpis.ConsultasMesActual || 0, kpis.ConsultasMesAnterior || 0),
            // Emergencia
            atenciones_emergencia: kpis.EmergenciasMesActual || 0,
            emergencia_tendencia: calcularTendencia(kpis.EmergenciasMesActual || 0, kpis.EmergenciasMesAnterior || 0),
            // Hospitalización
            hospitalizacion: kpis.HospitalizacionMesActual || 0,
            hospitalizacion_tendencia: calcularTendencia(kpis.HospitalizacionMesActual || 0, kpis.HospitalizacionMesAnterior || 0),
            // Camas
            Camas_Ocupadas_Hosp: kpis.Camas_Ocupadas_Hosp || 0,
            Camas_Desocupadas_Hosp: kpis.Camas_Desocupadas_Hosp || 0,
            Camas_Ocupadas_Emerg: kpis.Camas_Ocupadas_Emerg || 0,
            Camas_Desocupadas_Emerg: kpis.Camas_Desocupadas_Emerg || 0,
          },
          rendimiento_mensual: rendimientoMensualFormateado,
          emergencia_mensual: emergenciaMensualFormateado,
          historial_quirurgico: historialQuirurgicoFormateado,
          rendimientoPorServicio,
          financiamientoPorServicio,
        }
      };

    } catch (error: any) {
      console.error('[DashboardService] Error en consolidación:', error.message);
      throw error;
    }
  }
}