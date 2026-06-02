import { DashboardRepository, MensualRaw } from '../repositories/dashboard.repository';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();
  private nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

  async getDashboardData() {
    try {
      const fechaActual = new Date();
      const anioActual = fechaActual.getFullYear();
      const mesActual = fechaActual.getMonth() + 1;

      // Consumo en paralelo pasando año y mes actual al repositorio optimizado
      const [kpisRaw, rendimientoRaw, horasRaw] = await Promise.all([
        this.dashboardRepository.getKpisGlobales(anioActual, mesActual),
        this.dashboardRepository.getRendimientoMensual(anioActual),
        this.dashboardRepository.getDemandaPorHoras(anioActual)
      ]);

      // Función matemática real para calcular el porcentaje de variación mensual
      const calcularTendencia = (actual: number, anterior: number): number => {
        if (!anterior || anterior === 0) return 0;
        return parseFloat((((actual - anterior) / anterior) * 100).toFixed(1));
      };

      // FORMATEADOR 1 (Izquierdo): Estructura de Meses para el gráfico de barras
      const rendimientoMensualFormateado = this.nombresMeses.map((mesNombre, indice) => {
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
            // 1. Consultas Médicas: Cambiado a data del MES ACTUAL real
            consultas_medicas: kpisRaw.ConsultasMesActual || 0, 
            consultas_tendencia: calcularTendencia(kpisRaw.ConsultasMesActual, kpisRaw.ConsultasMesAnterior),
            
            // 2. Cirugías Exitosas: Cambiado a data de CIRUGÍAS del MES ACTUAL real (¡Ya no es el TotalAnual!)
            cirugias_exitosas: kpisRaw.CirugiasMesActual || 0, 
            cirugias_tendencia: calcularTendencia(kpisRaw.CirugiasMesActual, kpisRaw.CirugiasMesAnterior),
            
            // 3. Atenciones de Emergencia: Cambiado a data de EMERGENCIA del MES ACTUAL real
            atenciones_emergencia: kpisRaw.EmergenciasMesActual || 0, 
            emergencia_tendencia: calcularTendencia(kpisRaw.EmergenciasMesActual, kpisRaw.EmergenciasMesAnterior),
            
            // 4. Ocupación de Camas Actual: Viene calculado directamente y exacto desde la query SQL
            ocupacion_camas: kpisRaw.PorcentajeOcupacionCamas || 0,
            camas_tendencia: 0
          },
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