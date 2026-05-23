import { ReportesRepository } from '../repositories/reportes.repository';
import { ReporteKpi } from '../types/reportes';

export class ReportesService {
  private reportesRepository = new ReportesRepository();

  async getDashboardKpis(): Promise<ReporteKpi[]> {
    return this.reportesRepository.getDashboardKpis();
  }
}
