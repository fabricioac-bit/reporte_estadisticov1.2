import { ProductividadMes } from '../types/reportes';

export class ProductividadRepository {
  async getProductividadMensual(): Promise<ProductividadMes[]> {
    return [
      { mes: 'Ene', consultas: 1200, cirugias: 85, emergencias: 450 },
      { mes: 'Feb', consultas: 1350, cirugias: 90, emergencias: 480 },
      { mes: 'Mar', consultas: 1500, cirugias: 110, emergencias: 520 },
      { mes: 'Abr', consultas: 1400, cirugias: 95, emergencias: 490 },
      { mes: 'May', consultas: 1650, cirugias: 120, emergencias: 580 },
      { mes: 'Jun', consultas: 1800, cirugias: 130, emergencias: 620 },
    ];
  }
}
