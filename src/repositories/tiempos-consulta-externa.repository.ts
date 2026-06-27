import mssql from 'mssql';
import { executeQuery } from '../lib/db';

export interface IndicadoresConsultaExterna {
  CitasTotales: number;
  CitasAtendidas: number;
  CitasDesiertas: number;
  CitasEliminadas: number;
}

export interface EvolucionMensual {
  mes: string;
  atendidas: number;
  desiertas: number;
  eliminadas: number;
}

export interface EspecialidadTop {
  Especialidad: string;
  Eliminadas: number;
  SinAtender: number;
  TotalCitas: number;
}

export interface TiemposConsultaExternaData {
  indicadores: IndicadoresConsultaExterna;
  evolucion: EvolucionMensual[];
  topEliminadas: EspecialidadTop[];
  topSinAtender: EspecialidadTop[];
}

export class TiemposConsultaExternaRepository {
  async getTiemposConsultaExterna(fechaInicio: string, fechaFin: string): Promise<TiemposConsultaExternaData> {
    const query = `
;WITH BaseCitas AS (
    SELECT
        a.IdAtencion,
        a.FechaIngreso AS fecha,
        esp.Nombre AS Especialidad,

        CASE 
            WHEN ISNULL(a.IdEstadoAtencion, -1) <> 0 
                 AND a.FyHFinal IS NOT NULL 
            THEN 1 ELSE 0 
        END AS Atendida,

        CASE 
            WHEN ISNULL(a.IdEstadoAtencion, -1) <> 0 
                 AND a.FyHFinal IS NULL 
            THEN 1 ELSE 0 
        END AS Desierta,

        CASE 
            WHEN ISNULL(a.IdEstadoAtencion, -1) = 0 
            THEN 1 ELSE 0 
        END AS Eliminada
    FROM Atenciones a
    INNER JOIN Especialidades esp
        ON esp.IdEspecialidad = a.IdEspecialidadMedico
    WHERE a.EsPacienteExterno <> 1
      AND a.IdTipoServicio = 1
      AND a.FechaIngreso >= @FECHAINICIO
      AND a.FechaIngreso < DATEADD(DAY, 1, @FECHAFIN)
),
Indicadores AS (
    SELECT
        COUNT(IdAtencion) AS CitasTotales,
        SUM(Atendida) AS CitasAtendidas,
        SUM(Desierta) AS CitasDesiertas,
        SUM(Eliminada) AS CitasEliminadas
    FROM BaseCitas
),
Evolucion AS (
    SELECT
        YEAR(fecha) AS anioNumero,
        MONTH(fecha) AS mesNumero,
        SUM(Atendida) AS atendidas,
        SUM(Desierta) AS desiertas,
        SUM(Eliminada) AS eliminadas
    FROM BaseCitas
    GROUP BY YEAR(fecha), MONTH(fecha)
),
TopEliminadas AS (
    SELECT TOP 5
        Especialidad,
        SUM(Eliminada) AS Eliminadas,
        COUNT(IdAtencion) AS TotalCitas
    FROM BaseCitas
    WHERE Especialidad IS NOT NULL
    GROUP BY Especialidad
    HAVING SUM(Eliminada) > 0
    ORDER BY SUM(Eliminada) DESC
),
TopSinAtender AS (
    SELECT TOP 5
        Especialidad,
        SUM(Desierta) AS SinAtender,
        COUNT(IdAtencion) AS TotalCitas
    FROM BaseCitas
    WHERE Especialidad IS NOT NULL
    GROUP BY Especialidad
    HAVING SUM(Desierta) > 0
    ORDER BY SUM(Desierta) DESC
)
SELECT
    'INDICADORES' AS Tipo,
    CAST(CitasTotales AS VARCHAR(20)) AS Campo1,
    CAST(CitasAtendidas AS VARCHAR(20)) AS Campo2,
    CAST(CitasDesiertas AS VARCHAR(20)) AS Campo3,
    CAST(CitasEliminadas AS VARCHAR(20)) AS Campo4,
    CAST(NULL AS VARCHAR(20)) AS Campo5
FROM Indicadores

UNION ALL

SELECT
    'EVOLUCION',
    CAST(anioNumero AS VARCHAR(20)),
    CAST(mesNumero AS VARCHAR(20)),
    CAST(atendidas AS VARCHAR(20)),
    CAST(desiertas AS VARCHAR(20)),
    CAST(eliminadas AS VARCHAR(20))
FROM Evolucion

UNION ALL

SELECT
    'TOP_ELIMINADAS',
    Especialidad,
    CAST(Eliminadas AS VARCHAR(20)),
    CAST(TotalCitas AS VARCHAR(20)),
    CAST(NULL AS VARCHAR(20)),
    CAST(NULL AS VARCHAR(20))
FROM TopEliminadas

UNION ALL

SELECT
    'TOP_SIN_ATENDER',
    Especialidad,
    CAST(SinAtender AS VARCHAR(20)),
    CAST(TotalCitas AS VARCHAR(20)),
    CAST(NULL AS VARCHAR(20)),
    CAST(NULL AS VARCHAR(20))
FROM TopSinAtender
`;

    const result = await executeQuery<{ Tipo: string; Campo1: string; Campo2: string; Campo3: string; Campo4: string; Campo5: string }>(query, {
      FECHAINICIO: { type: mssql.Date, value: fechaInicio },
      FECHAFIN: { type: mssql.Date, value: fechaFin },
    });

    const indicadoresRow = result.recordset.find((item) => item.Tipo === 'INDICADORES');
    const evolucionRows = result.recordset
      .filter((item) => item.Tipo === 'EVOLUCION')
      .map((item) => ({
        anio: Number(item.Campo1),
        mes: String(Number(item.Campo2)).padStart(2, '0'),
        atendidas: Number(item.Campo3),
        desiertas: Number(item.Campo4),
        eliminadas: Number(item.Campo5),
      }));

    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    const evolucion: EvolucionMensual[] = [];
    let actual = new Date(inicio.getFullYear(), inicio.getMonth(), 1);

    while (actual <= fin) {
      const anio = actual.getFullYear();
      const mes = String(actual.getMonth() + 1).padStart(2, '0');
      const row = evolucionRows.find((item) => item.anio === anio && item.mes === mes);
      evolucion.push({
        mes: `${anio}-${mes}`,
        atendidas: row?.atendidas || 0,
        desiertas: row?.desiertas || 0,
        eliminadas: row?.eliminadas || 0,
      });
      actual = new Date(actual.getFullYear(), actual.getMonth() + 1, 1);
    }

    const topEliminadas = result.recordset
      .filter((item) => item.Tipo === 'TOP_ELIMINADAS')
      .map((item) => ({
        Especialidad: item.Campo1,
        Eliminadas: Number(item.Campo2),
        TotalCitas: Number(item.Campo3),
        SinAtender: 0,
      }));

    const topSinAtender = result.recordset
      .filter((item) => item.Tipo === 'TOP_SIN_ATENDER')
      .map((item) => ({
        Especialidad: item.Campo1,
        SinAtender: Number(item.Campo2),
        TotalCitas: Number(item.Campo3),
        Eliminadas: 0,
      }));

    return {
      indicadores: {
        CitasTotales: Number(indicadoresRow?.Campo1 || 0),
        CitasAtendidas: Number(indicadoresRow?.Campo2 || 0),
        CitasDesiertas: Number(indicadoresRow?.Campo3 || 0),
        CitasEliminadas: Number(indicadoresRow?.Campo4 || 0),
      },
      evolucion,
      topEliminadas,
      topSinAtender,
    };
  }
}