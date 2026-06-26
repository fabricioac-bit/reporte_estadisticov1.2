import mssql from 'mssql';
import { executeQuery } from '../lib/db';

export interface MensualRaw {
  MesNum: number;
  Cantidad: number;
}

export interface RendimientoServicioRaw {
  IdTipoServicio: number;
  ServicioNombre: string;
  MesNum: number;
  Cant_Atendidos: number;
  Cant_NoAtendidos: number;
  Cant_Eliminadas: number;
}

export interface FinanciamientoServicioRaw {
  IdTipoServicio: number;
  ServicioNombre: string;
  IdFuenteFinanciamiento: number;
  NombreFuente: string;
  Cant_Atendidos: number;
}

export class DashboardRepository {

  async getKpisGlobales(anio: number, mes: number): Promise<any> {
    const query = `
      SELECT
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = @mes
           AND FyHFinal IS NOT NULL AND EsPacienteExterno <> 1
           AND IdTipoServicio = 1 AND idEstadoAtencion <> 0) as ConsultasMesActual,

        (SELECT COUNT(1) FROM sigh.dbo.Atenciones
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = (@mes - 1)
           AND FyHFinal IS NOT NULL AND EsPacienteExterno <> 1
           AND IdTipoServicio = 1 AND idEstadoAtencion <> 0) as ConsultasMesAnterior,

        (SELECT COUNT(1) FROM sigh.dbo.Atenciones
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = @mes
           AND FechaEgreso IS NOT NULL AND EsPacienteExterno <> 1
           AND IdTipoServicio = 2 AND idEstadoAtencion <> 0) as EmergenciasMesActual,

        (SELECT COUNT(1) FROM sigh.dbo.Atenciones
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = (@mes - 1)
           AND FechaEgreso IS NOT NULL AND EsPacienteExterno <> 1
           AND IdTipoServicio = 2 AND idEstadoAtencion <> 0) as EmergenciasMesAnterior,

        (SELECT COUNT(1) FROM sigh.dbo.Atenciones
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = @mes
           AND FechaEgreso IS NOT NULL AND EsPacienteExterno <> 1
           AND IdTipoServicio = 3 AND idEstadoAtencion <> 0) as HospitalizacionMesActual,

        (SELECT COUNT(1) FROM sigh.dbo.Atenciones
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = (@mes - 1)
           AND FechaEgreso IS NOT NULL AND EsPacienteExterno <> 1
           AND IdTipoServicio = 3 AND idEstadoAtencion <> 0) as HospitalizacionMesAnterior,

        (SELECT SUM(CASE WHEN IdPaciente IS NOT NULL THEN 1 ELSE 0 END)
         FROM Camas
         WHERE IdServicioPropietario IN (218,216,213,219,420,399,400,401,290,255,249,6,405,179,2,318,317)) as Camas_Ocupadas_Hosp,

        (SELECT SUM(CASE WHEN IdPaciente IS NULL THEN 1 ELSE 0 END)
         FROM Camas
         WHERE IdServicioPropietario IN (218,216,213,219,420,399,400,401,290,255,249,6,405,179,2,318,317)) as Camas_Desocupadas_Hosp,

        (SELECT SUM(CASE WHEN IdPaciente IS NOT NULL THEN 1 ELSE 0 END)
         FROM Camas
         WHERE IdServicioPropietario IN (385,386,387,104,86,310)) as Camas_Ocupadas_Emerg,

        (SELECT SUM(CASE WHEN IdPaciente IS NULL THEN 1 ELSE 0 END)
         FROM Camas
         WHERE IdServicioPropietario IN (385,386,387,104,86,310)) as Camas_Desocupadas_Emerg
    `;

    const result = await executeQuery<any>(query, {
      anio: { type: mssql.Int, value: anio },
      mes: { type: mssql.Int, value: mes }
    });

    return result.recordset[0] || null;
  }

  async getRendimientoMensual(anio: number, mesHasta?: number): Promise<MensualRaw[]> {
    const mesFin = mesHasta || new Date().getMonth() + 1;
    const query = `
      SELECT 
        MONTH(FechaIngreso) as MesNum,
        COUNT(IdAtencion) as Cantidad
      FROM sigh.dbo.Atenciones
      WHERE YEAR(FechaIngreso) = @anio
        AND MONTH(FechaIngreso) BETWEEN 1 AND @mesFin
        AND FyHFinal IS NOT NULL
        AND EsPacienteExterno <> 1
        AND IdTipoServicio = 1
        AND idEstadoAtencion <> 0
      GROUP BY MONTH(FechaIngreso)
      ORDER BY MONTH(FechaIngreso) ASC
    `;
    const result = await executeQuery<MensualRaw>(query, {
      anio: { type: mssql.Int, value: anio },
      mesFin: { type: mssql.Int, value: mesFin }
    });
    return result.recordset;
  }

  async getRendimientoEmergencia(anio: number, mesHasta?: number): Promise<MensualRaw[]> {
    const mesFin = mesHasta || new Date().getMonth() + 1;
    const query = `
      SELECT 
        MONTH(FechaIngreso) as MesNum,
        COUNT(IdAtencion) as Cantidad
      FROM sigh.dbo.Atenciones
      WHERE YEAR(FechaIngreso) = @anio
        AND MONTH(FechaIngreso) BETWEEN 1 AND @mesFin
        AND FechaEgreso IS NOT NULL
        AND EsPacienteExterno <> 1
        AND IdTipoServicio = 2
        AND idEstadoAtencion <> 0
      GROUP BY MONTH(FechaIngreso)
      ORDER BY MONTH(FechaIngreso) ASC
    `;
    const result = await executeQuery<MensualRaw>(query, {
      anio: { type: mssql.Int, value: anio },
      mesFin: { type: mssql.Int, value: mesFin }
    });
    return result.recordset;
  }

  async getDemandaPorHoras(anio: number): Promise<MensualRaw[]> {
    const query = `
      SELECT 
        DATEPART(HOUR, FechaIngreso) as MesNum,
        COUNT(IdAtencion) as Cantidad
      FROM sigh.dbo.Atenciones
      WHERE YEAR(FechaIngreso) = @anio
        AND DATEPART(HOUR, FechaIngreso) BETWEEN 6 AND 20
      GROUP BY DATEPART(HOUR, FechaIngreso)
      ORDER BY MesNum ASC
    `;
    const result = await executeQuery<MensualRaw>(query, {
      anio: { type: mssql.Int, value: anio }
    });
    return result.recordset;
  }

  async getRendimientoUnificado(anio: number, mesHasta: number): Promise<RendimientoServicioRaw[]> {
    const query = `
      SELECT
        a.IdTipoServicio,
        CASE a.IdTipoServicio
          WHEN 1 THEN 'CE'
          WHEN 2 THEN 'Emergencia'
          WHEN 3 THEN 'Hospitalización'
        END AS ServicioNombre,
        MONTH(a.FechaIngreso) AS MesNum,
        SUM(CASE WHEN a.idEstadoAtencion <> 0
          AND ((a.IdTipoServicio = 1 AND a.FyHFinal IS NOT NULL)
            OR (a.IdTipoServicio IN (2,3) AND a.FechaEgreso IS NOT NULL))
          THEN 1 ELSE 0 END) AS Cant_Atendidos,
        SUM(CASE WHEN a.idEstadoAtencion <> 0
          AND ((a.IdTipoServicio = 1 AND a.FyHFinal IS NULL)
            OR (a.IdTipoServicio IN (2,3) AND a.FechaEgreso IS NULL))
          THEN 1 ELSE 0 END) AS Cant_NoAtendidos,
        SUM(CASE WHEN a.idEstadoAtencion = 0 THEN 1 ELSE 0 END) AS Cant_Eliminadas
      FROM sigh.dbo.Atenciones a
      INNER JOIN sigh.dbo.Especialidades esp
          ON esp.IdEspecialidad = a.IdEspecialidadMedico
      WHERE a.EsPacienteExterno <> 1
        AND a.IdTipoServicio IN (1, 2, 3)
        AND YEAR(a.FechaIngreso) = @anio
        AND MONTH(a.FechaIngreso) BETWEEN 1 AND @mesHasta
        AND a.FechaIngreso < CASE
            WHEN MONTH(GETDATE()) = @mesHasta AND YEAR(GETDATE()) = @anio
            THEN DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
            ELSE DATEADD(DAY, 1, EOMONTH(DATEFROMPARTS(@anio, @mesHasta, 1)))
        END
      GROUP BY a.IdTipoServicio, MONTH(a.FechaIngreso)
      ORDER BY a.IdTipoServicio, MONTH(a.FechaIngreso)
    `;
    const result = await executeQuery<RendimientoServicioRaw>(query, {
      anio: { type: mssql.Int, value: anio },
      mesHasta: { type: mssql.Int, value: mesHasta }
    });
    return result.recordset;
  }

  async getFinanciamientoPorServicio(anio: number, mesHasta: number): Promise<FinanciamientoServicioRaw[]> {
    const query = `
      SELECT
        a.IdTipoServicio,
        CASE a.IdTipoServicio
          WHEN 1 THEN 'CE'
          WHEN 2 THEN 'Emergencia'
          WHEN 3 THEN 'Hospitalización'
        END AS ServicioNombre,
        f.IdFuenteFinanciamiento,
        f.Descripcion AS NombreFuente,
        COUNT(a.IdAtencion) AS Cant_Atendidos
      FROM sigh.dbo.Atenciones a
      INNER JOIN sigh.dbo.FuentesFinanciamiento f
        ON f.IdFuenteFinanciamiento = a.IdFuenteFinanciamiento
      WHERE
        a.EsPacienteExterno <> 1
        AND a.idEstadoAtencion <> 0
        AND a.IdTipoServicio IN (1, 2, 3)
        AND a.IdFuenteFinanciamiento IN (1, 5, 3, 4, 7, 9, 16, 17)
        AND YEAR(a.FechaIngreso) = @anio
        AND MONTH(a.FechaIngreso) BETWEEN 1 AND @mesHasta
        AND ((a.IdTipoServicio = 1 AND a.FyHFinal IS NOT NULL)
          OR (a.IdTipoServicio IN (2,3) AND a.FechaEgreso IS NOT NULL))
      GROUP BY
        a.IdTipoServicio,
        CASE a.IdTipoServicio
          WHEN 1 THEN 'CE'
          WHEN 2 THEN 'Emergencia'
          WHEN 3 THEN 'Hospitalización'
        END,
        f.IdFuenteFinanciamiento,
        f.Descripcion
      ORDER BY
        a.IdTipoServicio,
        f.IdFuenteFinanciamiento
    `;
    const result = await executeQuery<FinanciamientoServicioRaw>(query, {
      anio: { type: mssql.Int, value: anio },
      mesHasta: { type: mssql.Int, value: mesHasta }
    });
    return result.recordset;
  }
}