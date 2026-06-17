import { DashboardRepository, MensualRaw } from '../repositories/dashboard.repository';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();
  private todosLosMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  async getDashboardData(anio?: number, mes?: number) {
    try {
      const fechaActual = new Date();
      const anioActual = anio || fechaActual.getFullYear();
      const mesActual = mes || fechaActual.getMonth() + 1;

      // Consumo en paralelo pasando año y mes actual al repositorio optimizado
      const [kpisRaw, rendimientoRaw, emergenciaRaw, horasRaw] = await Promise.all([
        this.dashboardRepository.getKpisGlobales(anioActual, mesActual),
        this.dashboardRepository.getRendimientoMensual(anioActual, mesActual),
        this.dashboardRepository.getRendimientoEmergencia(anioActual, mesActual),
        this.dashboardRepository.getDemandaPorHoras(anioActual)
      ]);

      // Función matemática real para calcular el porcentaje de variación mensual
      const calcularTendencia = (actual: number, anterior: number): number => {
        if (!anterior || anterior === 0) return 0;
        return parseFloat((((actual - anterior) / anterior) * 100).toFixed(1));
      };

      // FORMATEADOR 1 (Izquierdo): Estructura de Meses dinámicos para el gráfico de barras
      const mesesParaMostrar = this.todosLosMeses.slice(0, mesActual);
      const rendimientoMensualFormateado = mesesParaMostrar.map((mesNombre, indice) => {
        const mesNumero = indice + 1;
        const registro = rendimientoRaw.find(r => r.MesNum === mesNumero);
        return {
          mes: mesNombre,
          cantidad: registro ? registro.Cantidad : 0
        };
      });

      // FORMATEADOR 2 (Derecho): Estructura de Horas en la propiedad 'mes' para el componente de líneas
      const horasEje = Array.from({ length: 15 }, (_, i) => i + 6);
      const historialQuirurgicoFormateado = horasEje.map(hora => {
        const registro = horasRaw.find(h => h.MesNum === hora);
        return {
          mes: `${hora.toString().padStart(2, '0')}:00`,
          cantidad: registro ? registro.Cantidad : 0
        };
      });

      return {
        success: true,
        data: {
          kpis: {
            consultas_medicas: kpisRaw.ConsultasMesActual || 0, 
            consultas_tendencia: calcularTendencia(kpisRaw.ConsultasMesActual, kpisRaw.ConsultasMesAnterior),
            atenciones_emergencia: kpisRaw.EmergenciasMesActual || 0, 
            emergencia_tendencia: calcularTendencia(kpisRaw.EmergenciasMesActual, kpisRaw.EmergenciasMesAnterior),
          },
          // Emergencia: misma estructura que rendimiento_mensual
          emergencia_mensual: mesesParaMostrar.map((mesNombre, indice) => {
            const mesNumero = indice + 1;
            const registro = emergenciaRaw.find(r => r.MesNum === mesNumero);
            return {
              mes: mesNombre,
              cantidad: registro ? registro.Cantidad : 0
            };
          }),
          rendimiento_mensual: rendimientoMensualFormateado,
          historial_quirurgico: historialQuirurgicoFormateado
        }
      };

    } catch (error: any) {
      console.error('[DashboardService] Error en consolidación de producción:', error.message);
      throw error;
    }
  }
}