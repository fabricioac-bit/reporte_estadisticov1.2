import {
  ProductividadConsultaRepository,
  ProduccionDiaria,
  ProduccionConsultaFilters,
  DepartamentoFiltro,
  EspecialidadFiltro,
  AnioFiltro,
  MedicoFiltro,
} from '../repositories/productividad-consulta.repository';

export class ProductividadConsultaService {
  private repository = new ProductividadConsultaRepository();

  async getAniosDisponibles(): Promise<AnioFiltro[]> {
    return this.repository.getAniosDisponibles();
  }

  async getDepartamentos(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters
  ): Promise<DepartamentoFiltro[]> {
    return this.repository.getDepartamentos(fechaInicio, fechaFin, filters);
  }

  async getEspecialidades(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters
  ): Promise<EspecialidadFiltro[]> {
    return this.repository.getEspecialidades(fechaInicio, fechaFin, filters);
  }

  async getMedicos(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters
  ): Promise<MedicoFiltro[]> {
    return this.repository.getMedicos(fechaInicio, fechaFin, filters);
  }

  async getProduccionConsultaExterna(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters
  ): Promise<ProduccionDiaria[]> {
    return this.repository.getProduccionConsultaExterna(fechaInicio, fechaFin, filters);
  }

  async getCurvaCargaPacientes(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters
  ): Promise<Array<{ dia: string; atenciones: number }>> {
    return this.repository.getCurvaCargaPacientes(fechaInicio, fechaFin, filters);
  }
}
