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
        -- Totales del Año Actual (Para el número grande de la tarjeta)
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio AND IdTipoServicio = 1) as ConsultasAnual,
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio AND IdTipoServicio = 2) as EmergenciasAnual,
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio) as TotalAnual,
        
        -- Datos del Mes Actual (Para calcular la tendencia)
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = @mes AND IdTipoServicio = 1) as ConsultasMesActual,
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = @mes AND IdTipoServicio = 2) as EmergenciasMesActual,
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = @mes) as TotalMesActual,
        
        -- Datos del Mes Anterior (Para comparar la tendencia)
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = (@mes - 1) AND IdTipoServicio = 1) as ConsultasMesAnterior,
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = (@mes - 1) AND IdTipoServicio = 2) as EmergenciasMesAnterior,
        (SELECT COUNT(1) FROM sigh.dbo.Atenciones WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) = (@mes - 1)) as TotalMesAnterior,
        
        -- Censo de Camas en tiempo real
        (SELECT COUNT(1) FROM sigh.dbo.Camas WHERE IdPaciente IS NOT NULL AND IdPaciente <> 0) as CamasOcupadas,
        (SELECT COUNT(1) FROM sigh.dbo.Camas) as CamasTotales
    `;

    const result = await executeQuery<any>(query, {
      anio: { type: mssql.Int, value: anio },
      mes: { type: mssql.Int, value: mes }
    });

    return result.recordset[0] || null;
  }

  // 2. Gráfico Izquierdo: Volumen por MESES
  async getRendimientoMensual(anio: number): Promise<MensualRaw[]> {
    const query = `
      SELECT 
        MONTH(FechaIngreso) as MesNum,
        COUNT(IdAtencion) as Cantidad
      FROM sigh.dbo.Atenciones
      WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) BETWEEN 1 AND 6
      GROUP BY MONTH(FechaIngreso)
      ORDER BY MONTH(FechaIngreso) ASC
    `;

    const result = await executeQuery<MensualRaw>(query, {
      anio: { type: mssql.Int, value: anio }
    });

    return result.recordset;
  }

  // 3. Gráfico Derecho: Volumen agrupado por HORAS
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