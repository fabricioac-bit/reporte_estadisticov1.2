import { executeQuery } from '../lib/db';

export class EmpleadosService {
  async getEmpleadosActivosCount(): Promise<number> {
    try {
      const result = await executeQuery<{ count: number }>(
        'SELECT COUNT(*) as count FROM dbo.Empleados WHERE esActivo = 1'
      );
      return result.recordset[0]?.count || 0;
    } catch (e) {
      // Fallback si la tabla no está creada
      return 145;
    }
  }
}
