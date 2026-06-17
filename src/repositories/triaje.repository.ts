import mssql from 'mssql';
import { executeQuery } from '@/lib/db';
import { TriajeRegistro, ParamsTriaje } from '@/types/triaje';

export class TriajeRepository {
  async obtenerRegistrosTriaje(params: ParamsTriaje): Promise<TriajeRegistro[]> {
    const query = `
      WITH TriajesOrdenados AS (
        SELECT 
          A.*, 
          ROW_NUMBER() OVER (
            PARTITION BY A.NroHistoriaClinica 
            ORDER BY A.CitaFechaAtencion DESC, A.idAtencion DESC
          ) AS RegistroNumero
        FROM SIGH_EXTERNA..atencionesCE A
        WHERE A.CitaFechaAtencion BETWEEN @fechaInicio AND @fechaFin
          AND ISNUMERIC(A.TriajePeso) = 1
          AND ISNUMERIC(A.TriajeTalla) = 1
          AND CAST(A.TriajePeso AS DECIMAL(10,2)) > 0
          AND CAST(A.TriajeTalla AS DECIMAL(10,2)) > 0
      )
      SELECT
        CONCAT(
          P.ApellidoPaterno, ' ', 
          P.ApellidoMaterno, ', ', 
          P.PrimerNombre,
          ISNULL(' ' + NULLIF(P.SegundoNombre, ''), ''),
          ISNULL(' ' + NULLIF(P.TercerNombre, ''), '')
        ) AS Paciente,
        P.NroDocumento AS DniPaciente,
        ISNULL(S.Nombre, 'NO ESPECIFICADO') AS AreaTriaje,
        CONVERT(VARCHAR(10), A.TriajeFecha, 120) AS FechaTriaje,
        CONVERT(VARCHAR(5), A.TriajeFecha, 108) AS HoraTriaje,
        A.TriajeTalla,
        A.TriajePeso,
        ROUND(CAST(A.TriajePeso AS DECIMAL(10,2)) / NULLIF(POWER(CAST(A.TriajeTalla AS DECIMAL(10,2)) / 100.0, 2), 0), 2) AS IMC,
        CASE
          WHEN CAST(A.TriajePeso AS DECIMAL(10,2)) / NULLIF(POWER(CAST(A.TriajeTalla AS DECIMAL(10,2)) / 100.0, 2), 0) < 18.5 THEN 'Delgado'
          WHEN CAST(A.TriajePeso AS DECIMAL(10,2)) / NULLIF(POWER(CAST(A.TriajeTalla AS DECIMAL(10,2)) / 100.0, 2), 0) < 25 THEN 'Normal'
          WHEN CAST(A.TriajePeso AS DECIMAL(10,2)) / NULLIF(POWER(CAST(A.TriajeTalla AS DECIMAL(10,2)) / 100.0, 2), 0) < 30 THEN 'Sobrepeso'
          WHEN CAST(A.TriajePeso AS DECIMAL(10,2)) / NULLIF(POWER(CAST(A.TriajeTalla AS DECIMAL(10,2)) / 100.0, 2), 0) < 35 THEN 'Obesidad I'
          WHEN CAST(A.TriajePeso AS DECIMAL(10,2)) / NULLIF(POWER(CAST(A.TriajeTalla AS DECIMAL(10,2)) / 100.0, 2), 0) < 40 THEN 'Obesidad II'
          ELSE 'Obesidad III'
        END AS EstadoNutricional
      FROM TriajesOrdenados A
      INNER JOIN sigh..atenciones SAT ON CAST(A.idAtencion AS INT) = CAST(SAT.IdAtencion AS INT)
      INNER JOIN sigh..Pacientes P ON SAT.IdPaciente = P.IdPaciente
      LEFT JOIN sigh..Servicios S ON SAT.IdServicioIngreso = S.IdServicio
      WHERE A.RegistroNumero = 1
        AND (@paciente IS NULL OR CONCAT(
          P.ApellidoPaterno, ' ', 
          P.ApellidoMaterno, ', ', 
          P.PrimerNombre,
          ISNULL(' ' + NULLIF(P.SegundoNombre, ''), ''),
          ISNULL(' ' + NULLIF(P.TercerNombre, ''), '')
        ) LIKE '%' + @paciente + '%')
        AND (@dniPaciente IS NULL OR P.NroDocumento LIKE '%' + @dniPaciente + '%')
        AND (@servicio IS NULL OR S.Nombre LIKE '%' + @servicio + '%')
      ORDER BY Paciente ASC;
    `;

    const resultado = await executeQuery<TriajeRegistro>(query, {
      fechaInicio: { type: mssql.VarChar, value: params.fechaInicio },
      fechaFin: { type: mssql.VarChar, value: params.fechaFin },
      paciente: { type: mssql.VarChar, value: params.paciente ?? null },
      dniPaciente: { type: mssql.VarChar, value: params.dniPaciente ?? null },
      servicio: { type: mssql.VarChar, value: params.servicio ?? null },
    });

    return resultado.recordset;
  }
}
