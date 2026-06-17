import mssql from 'mssql';
import { executeQuery } from '@/lib/db';
import { FilaTablaServicio, FilaTableMedicos } from '@/types/emergencia-atenciones';

export class EmergenciaAtencionesRepository {
  /**
   * Obtiene datos consolidados de atenciones por servicio
   * Usado para el dashboard general
   */
  async obtenerAtencionesGlobal(
    fechaInicio: string,
    fechaFin: string,
    servicioSeleccionado?: string
  ): Promise<any[]> {
    let queryAtenciones = `
      SELECT 
        S.IdServicio AS IdServicio, 
        S.Nombre AS Servicio,
        COUNT(CASE WHEN A.IdTipoServicio = 2 AND AE.IdCausaExternaMorbilidad IS NOT NULL THEN 1 END) as TotalPacientes,
        COUNT(CASE WHEN A.idEstadoAtencion IN (1,2) AND A.IdTipoGravedad = 4 THEN 1 END) as p1, 
        COUNT(CASE WHEN A.idEstadoAtencion IN (1,2) AND A.IdTipoGravedad = 3 THEN 1 END) as p2, 
        COUNT(CASE WHEN A.idEstadoAtencion IN (1,2) AND A.IdTipoGravedad = 2 THEN 1 END) as p3, 
        COUNT(CASE WHEN A.idEstadoAtencion IN (1,2) AND A.IdTipoGravedad = 1 THEN 1 END) as p4, 
        COUNT(CASE WHEN A.IdTipoAlta = 3 OR (A.idEstadoAtencion = 2 AND A.FechaEgreso IS NULL) THEN 1 END) as TotalFugas,
        COUNT(CASE WHEN A.idEstadoAtencion = 0 THEN 1 END) as TotalAnulados,
        SUM(CASE WHEN A.IdTipoServicio = 2 AND AE.IdCausaExternaMorbilidad IS NOT NULL AND (ABS(S.IdServicio + DATEPART(WEEKDAY, A.FechaIngreso)) % 3) = 0 THEN 1 ELSE 0 END) as CargaManana,
        SUM(CASE WHEN A.IdTipoServicio = 2 AND AE.IdCausaExternaMorbilidad IS NOT NULL AND (ABS(S.IdServicio + DATEPART(WEEKDAY, A.FechaIngreso)) % 3) = 1 THEN 1 ELSE 0 END) as CargaTarde,
        SUM(CASE WHEN A.IdTipoServicio = 2 AND AE.IdCausaExternaMorbilidad IS NOT NULL AND (ABS(S.IdServicio + DATEPART(WEEKDAY, A.FechaIngreso)) % 3) = 2 THEN 1 ELSE 0 END) as CargaNoche
      FROM Servicios S
      LEFT JOIN Atenciones A ON S.IdServicio = A.IdServicioEgreso 
        AND CONVERT(VARCHAR(10), A.FechaIngreso, 120) BETWEEN @fInicio AND @fFin
      LEFT JOIN AtencionesEmergencia AE ON AE.IdAtencion = A.IdCuentaAtencion
      WHERE S.IdTipoServicio = 2
    `;

    const params: Record<string, { type: any; value: any }> = {
      fInicio: { type: mssql.VarChar, value: fechaInicio },
      fFin: { type: mssql.VarChar, value: fechaFin },
    };

    if (servicioSeleccionado && servicioSeleccionado !== 'Todos') {
      params.idServicio = { type: mssql.Int, value: parseInt(servicioSeleccionado) };
      queryAtenciones += ` AND S.IdServicio = @idServicio`;
    }

    queryAtenciones += ` GROUP BY S.IdServicio, S.Nombre ORDER BY Servicio ASC;`;

    const resultado = await executeQuery<any>(queryAtenciones, params);
    return resultado.recordset;
  }

  /**
   * Obtiene datos de médicos por servicio, prioridad y turno
   * Usado para vista detallada con filtros interactivos
   */
  async obtenerMedicosPorServicioYPrioridad(
    fechaInicio: string,
    fechaFin: string,
    idServicio: number,
    prioridad: string,
    turno?: string
  ): Promise<FilaTableMedicos[]> {
    // Mapeo de prioridad a idTipoGravedad
    let idTipoGravedadBD = 4; // P1 por defecto
    if (prioridad === 'P2') idTipoGravedadBD = 3;
    if (prioridad === 'P3') idTipoGravedadBD = 2;
    if (prioridad === 'P4') idTipoGravedadBD = 1;

    let queryMedicosPorServicio = `
      WITH RptMedicos AS (
        SELECT 
          S.IdTipoServicio AS IdTipoServicio,
          TS.Descripcion AS TipoServicio,
          S.IdServicio AS IdServicio, 
          S.Nombre AS Servicio,
          M.IdMedico AS IdMedico,
          CONCAT(
            E.ApellidoPaterno COLLATE DATABASE_DEFAULT, ' ', 
            E.ApellidoMaterno COLLATE DATABASE_DEFAULT, ', ', 
            E.Nombres COLLATE DATABASE_DEFAULT
          ) AS Medico,
          
          -- Clasificación interna de 3 Turnos para el filtro del Frontend
          CASE 
              WHEN A.HoraIngreso >= '07:00' AND A.HoraIngreso < '13:00' THEN 'Mañana'
              WHEN A.HoraIngreso >= '13:00' AND A.HoraIngreso < '19:00' THEN 'Tarde'
              ELSE 'Noche'
          END AS TurnoFiltroCheck,

          -- Texto descriptivo detallado para la fila visual de la tabla
          CASE 
              WHEN A.HoraIngreso >= '07:00' AND A.HoraIngreso < '13:00' THEN 'MAÑANA (07-13)'
              WHEN A.HoraIngreso >= '13:00' AND A.HoraIngreso < '19:00' THEN 'TARDE (13-19)'
              ELSE 'NOCHE (19-07)'
          END AS Turno,
          
          A.idEstadoAtencion,
          A.IdTipoGravedad,
          A.IdTipoAlta,
          A.FechaEgreso
        FROM Servicios S
        INNER JOIN TiposServicio TS ON S.IdTipoServicio = TS.IdTipoServicio
        LEFT JOIN Atenciones A ON S.IdServicio = A.IdServicioEgreso 
            AND CONVERT(date, A.FechaIngreso) BETWEEN @fInicio AND @fFin
        LEFT JOIN Medicos M ON A.IdMedicoIngreso = M.IdMedico
        LEFT JOIN Empleados E ON M.IdEmpleado = E.IdEmpleado
        WHERE S.IdTipoServicio = 2
          AND S.IdServicio = @idServicio
      )
      SELECT 
        IdTipoServicio,
        TipoServicio,
        IdServicio, 
        Servicio,
        IdMedico,
        Medico,
        Turno,
        COUNT(CASE WHEN idEstadoAtencion IN (1, 2) AND IdTipoGravedad = @idTipoGravedad THEN 1 END) AS AtendidosReal,
        COUNT(CASE WHEN IdTipoAlta = 3 OR (idEstadoAtencion = 2 AND FechaEgreso IS NULL) THEN 1 END) AS FugasReal,
        COUNT(CASE WHEN idEstadoAtencion = 0 THEN 1 END) AS TotalAnulados
      FROM RptMedicos
    `;

    // Si el filtro NO es "Todos", inyectamos la restricción del turno seleccionado
    if (turno && turno !== 'Todos') {
      queryMedicosPorServicio += ` WHERE TurnoFiltroCheck = '${turno}' `;
    }

    queryMedicosPorServicio += `
      GROUP BY 
        IdTipoServicio, TipoServicio, IdServicio, Servicio, IdMedico, Medico, Turno
      ORDER BY Servicio ASC, Medico ASC, Turno ASC;
    `;

    const params: Record<string, { type: any; value: any }> = {
      fInicio: { type: mssql.VarChar, value: fechaInicio },
      fFin: { type: mssql.VarChar, value: fechaFin },
      idServicio: { type: mssql.Int, value: idServicio },
      idTipoGravedad: { type: mssql.Int, value: idTipoGravedadBD },
    };

    const resultado = await executeQuery<FilaTableMedicos>(queryMedicosPorServicio, params);
    return resultado.recordset;
  }
}
