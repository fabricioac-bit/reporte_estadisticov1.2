import mssql from 'mssql';
import { executeQuery } from '../lib/db';
import { Empleado } from '../types/empleado';

export class AuthRepository {
  async findByUsuario(usuario: string): Promise<Empleado | null> {
    const query = `
      SELECT IdEmpleado, 
             (RTRIM(Nombres) COLLATE database_default + ' ' COLLATE database_default + RTRIM(ApellidoPaterno) COLLATE database_default) as Nombre, 
             Usuario, Password, esActivo
      FROM dbo.Empleados
      WHERE LTRIM(RTRIM(Usuario)) = LTRIM(RTRIM(@usuario))
    `;

    const result = await executeQuery<Empleado>(query, {
      usuario: { type: mssql.NVarChar, value: usuario },
    });

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  async updatePassword(idEmpleado: number, password: string): Promise<void> {
    const query = `
      UPDATE dbo.Empleados
      SET Password = @password
      WHERE IdEmpleado = @idEmpleado
    `;

    await executeQuery(query, {
      password: { type: mssql.NVarChar, value: password },
      idEmpleado: { type: mssql.Int, value: idEmpleado },
    });
  }
}
