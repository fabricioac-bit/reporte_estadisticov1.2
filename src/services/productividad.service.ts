import { ProductividadRepository } from '../repositories/productividad.repository';
import { ProductividadMes } from '../types/reportes';

export class ProductividadService {
  private productividadRepository = new ProductividadRepository();

  async getProductividadMensual(): Promise<ProductividadMes[]> {
    return this.productividadRepository.getProductividadMensual();
  }
}
