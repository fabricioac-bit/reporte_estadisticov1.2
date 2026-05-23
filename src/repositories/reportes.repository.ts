import { ReporteKpi } from '../types/reportes';

export class ReportesRepository {
  async getDashboardKpis(): Promise<ReporteKpi[]> {
    // Preparado para consultas SQL agregadas reales:
    // const query = "SELECT ...";
    // ...

    return [
      {
        id: 'consultas',
        titulo: 'Consultas Médicas',
        valor: '8,900',
        cambio: '+12% vs mes anterior',
        esPositivo: true,
        icono: 'UserCheck',
      },
      {
        id: 'cirugias',
        titulo: 'Cirugías Exitosas',
        valor: '630',
        cambio: '+8% vs mes anterior',
        esPositivo: true,
        icono: 'Activity',
      },
      {
        id: 'emergencias',
        titulo: 'Atenciones Emergencia',
        valor: '3,140',
        cambio: '-4% vs mes anterior',
        esPositivo: false,
        icono: 'AlertTriangle',
      },
      {
        id: 'camas',
        titulo: 'Ocupación de Camas',
        valor: '88.5%',
        cambio: '+2.1% esta semana',
        esPositivo: true,
        icono: 'Bed',
      },
    ];
  }
}
