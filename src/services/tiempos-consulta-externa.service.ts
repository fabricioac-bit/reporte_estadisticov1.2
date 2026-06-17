import { TiemposConsultaExternaRepository, TiemposConsultaExternaData } from '../repositories/tiempos-consulta-externa.repository';

export class TiemposConsultaExternaService {
  private repository = new TiemposConsultaExternaRepository();

  async getTiemposConsultaExterna(fechaInicio: string, fechaFin: string): Promise<TiemposConsultaExternaData> {
    return this.repository.getTiemposConsultaExterna(fechaInicio, fechaFin);
  }
}