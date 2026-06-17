import mssql from 'mssql';
import { executeQuery } from '../lib/db';

export interface MensualRaw {
  MesNum: number;
  Cantidad: number;
}

export class DashboardRepository {
  // 1. KPIs Globales: Totales anuales + variables mensuales para calcular tendencias reales
  async getKpisGlobales(anio: number, mes: number): Promise<any> {
    const query = `
      SELECT 
        -- Consulta Externa: Mes Actual (con filtros consistentes)
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones 
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = @mes 
           AND FyHFinal IS NOT NULL AND EsPacienteExterno <> 1 
           AND IdTipoServicio = 1 AND idEstadoAtencion <> 0) as ConsultasMesActual,
        
        -- Consulta Externa: Mes Anterior (con filtros consistentes)
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones 
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = (@mes - 1) 
           AND FyHFinal IS NOT NULL AND EsPacienteExterno <> 1 
           AND IdTipoServicio = 1 AND idEstadoAtencion <> 0) as ConsultasMesAnterior,
        
        -- Emergencia: Mes Actual (con filtros consistentes)
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones 
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = @mes 
           AND FechaEgreso IS NOT NULL AND EsPacienteExterno <> 1 
           AND IdTipoServicio = 2 AND idEstadoAtencion <> 0) as EmergenciasMesActual,
        
        -- Emergencia: Mes Anterior (con filtros consistentes)
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones 
         WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = (@mes - 1) 
           AND FechaEgreso IS NOT NULL AND EsPacienteExterno <> 1 
           AND IdTipoServicio = 2 AND idEstadoAtencion <> 0) as EmergenciasMesAnterior
    `;

    const result = await executeQuery<any>(query, {
      anio: { type: mssql.Int, value: anio },
      mes: { type: mssql.Int, value: mes }
    });

    return result.recordset[0] || null;
  }

  // 2. Gráfico Izquierdo: Volumen de Consulta Externa por MESES (dinámico)
  async getRendimientoMensual(anio: number, mesHasta?: number): Promise<MensualRaw[]> {
    // Si no se especifica mes, usa el mes actual para limitar el rango
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

  // 3. Gráfico Emergencia: Volumen de Emergencia por MESES (dinámico)
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

  // 4. Gráfico Derecho: Volumen agrupado por HORAS
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
}