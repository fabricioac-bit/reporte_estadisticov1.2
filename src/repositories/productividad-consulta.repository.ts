import mssql from 'mssql';
import { executeQuery } from '../lib/db';

export interface ProduccionDiaria {
  Medico: string;
  TipoEmpleado: string;
  Especialidad: string;
  Turno: string;
  [dia: string]: any;
  TOTAL: number;
}

export interface DepartamentoFiltro {
  IdDepartamento: number;
  Nombre: string;
}

export interface EspecialidadFiltro {
  IdEspecialidad: number;
  Nombre: string;
  IdDepartamento: number;
}

export interface MedicoFiltro {
  IdMedico: number;
  Medico: string;
  TipoEmpleado: string;
}

export interface AnioFiltro {
  anio: number;
}

export interface ProduccionConsultaFilters {
  departamentoId?: number | null;
  especialidadId?: number | null;
  medicoId?: number | null;
  turno?: string | null;
}

const obtenerDiasEntreFechas = (fechaInicio: string, fechaFin: string): string[] => {
  const [anioInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
  const [anioFin, mesFin, diaFin] = fechaFin.split('-').map(Number);
  const inicio = new Date(anioInicio, mesInicio - 1, diaInicio);
  const fin = new Date(anioFin, mesFin - 1, diaFin);
  const dias: string[] = [];
  const actual = new Date(inicio);
  while (actual <= fin) {
    dias.push(String(actual.getDate()).padStart(2, '0'));
    actual.setDate(actual.getDate() + 1);
  }
  return dias;
};

const obtenerDiasPivot = (fechaInicio: string, fechaFin: string) => {
  const [anioInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
  const [anioFin, mesFin, diaFin] = fechaFin.split('-').map(Number);
  const inicio = new Date(anioInicio, mesInicio - 1, diaInicio);
  const fin = new Date(anioFin, mesFin - 1, diaFin);
  const dias: Array<{ clave: string; etiqueta: string }> = [];
  const cruzaMes = inicio.getMonth() !== fin.getMonth() || inicio.getFullYear() !== fin.getFullYear();
  const actual = new Date(inicio);
  while (actual <= fin) {
    const dia = String(actual.getDate()).padStart(2, '0');
    const etiqueta = cruzaMes
      ? `${String(actual.getMonth() + 1).padStart(2, '0')}-${dia}`
      : dia;
    dias.push({ clave: etiqueta, etiqueta });
    actual.setDate(actual.getDate() + 1);
  }
  return dias;
};

export class ProductividadConsultaRepository {

  async getAniosDisponibles(): Promise<AnioFiltro[]> {
    const query = `
SELECT DISTINCT
    YEAR(a.FyHFinal) AS anio
FROM Atenciones a
WHERE a.FyHFinal IS NOT NULL
    AND a.IdTipoServicio = 1
ORDER BY anio DESC
`;
    const result = await executeQuery<AnioFiltro>(query);
    return result.recordset;
  }

  async getDepartamentos(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters = {}
  ): Promise<DepartamentoFiltro[]> {
    const query = `
SELECT DISTINCT
    d.IdDepartamento,
    d.Nombre
FROM Atenciones a
INNER JOIN Citas c
    ON c.IdAtencion = a.IdAtencion
INNER JOIN ProgramacionMedica pr
    ON pr.IdProgramacion = c.IdProgramacion
INNER JOIN Especialidades esp
    ON esp.IdEspecialidad = a.IdEspecialidadMedico
INNER JOIN DepartamentosHospital d
    ON d.IdDepartamento = esp.IdDepartamento
LEFT JOIN Medicos m
    ON m.IdMedico = pr.IdMedico
WHERE a.FyHFinal IS NOT NULL
    AND a.IdTipoServicio = 1
    AND a.FyHFinal >= @FECHAINICIO
    AND a.FyHFinal < DATEADD(DAY, 1, @FECHAFIN)
    AND d.IdDepartamento NOT IN (10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20)
    AND (@ESPECIALIDAD_ID IS NULL OR esp.IdEspecialidad = @ESPECIALIDAD_ID)
    AND (@MEDICO_ID IS NULL OR m.IdMedico = @MEDICO_ID)
    AND (@TURNO IS NULL OR @TURNO = 'Todos' OR CASE WHEN CAST(pr.HoraInicio AS TIME) >= '07:00:00' AND CAST(pr.HoraInicio AS TIME) < '14:00:00' THEN 'M' ELSE 'T' END = @TURNO)
ORDER BY d.IdDepartamento ASC
`;
    const result = await executeQuery<DepartamentoFiltro>(query, {
      FECHAINICIO: { type: mssql.Date, value: fechaInicio },
      FECHAFIN: { type: mssql.Date, value: fechaFin },
      DEPARTAMENTO_ID: { type: mssql.Int, value: filters.departamentoId ?? null },
      ESPECIALIDAD_ID: { type: mssql.Int, value: filters.especialidadId ?? null },
      MEDICO_ID: { type: mssql.Int, value: filters.medicoId ?? null },
      TURNO: { type: mssql.NVarChar(1), value: filters.turno ?? null },
    });
    return result.recordset;
  }

  async getEspecialidades(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters = {}
  ): Promise<EspecialidadFiltro[]> {
    const query = `
SELECT DISTINCT
    esp.IdEspecialidad,
    esp.Nombre,
    esp.IdDepartamento
FROM Atenciones a
INNER JOIN Citas c
    ON c.IdAtencion = a.IdAtencion
INNER JOIN ProgramacionMedica pr
    ON pr.IdProgramacion = c.IdProgramacion
INNER JOIN Especialidades esp
    ON esp.IdEspecialidad = a.IdEspecialidadMedico
LEFT JOIN DepartamentosHospital d
    ON d.IdDepartamento = esp.IdDepartamento
LEFT JOIN Medicos m
    ON m.IdMedico = pr.IdMedico
WHERE a.FyHFinal IS NOT NULL
    AND a.IdTipoServicio = 1
    AND a.FyHFinal >= @FECHAINICIO
    AND a.FyHFinal < DATEADD(DAY, 1, @FECHAFIN)
    AND (@DEPARTAMENTO_ID IS NULL OR esp.IdDepartamento = @DEPARTAMENTO_ID)
    AND (@MEDICO_ID IS NULL OR m.IdMedico = @MEDICO_ID)
    AND (@TURNO IS NULL OR @TURNO = 'Todos' OR CASE WHEN CAST(pr.HoraInicio AS TIME) >= '07:00:00' AND CAST(pr.HoraInicio AS TIME) < '14:00:00' THEN 'M' ELSE 'T' END = @TURNO)
ORDER BY esp.Nombre ASC
`;
    const result = await executeQuery<EspecialidadFiltro>(query, {
      FECHAINICIO: { type: mssql.Date, value: fechaInicio },
      FECHAFIN: { type: mssql.Date, value: fechaFin },
      DEPARTAMENTO_ID: { type: mssql.Int, value: filters.departamentoId ?? null },
      MEDICO_ID: { type: mssql.Int, value: filters.medicoId ?? null },
      TURNO: { type: mssql.NVarChar(1), value: filters.turno ?? null },
    });
    return result.recordset;
  }

  async getMedicos(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters = {}
  ): Promise<MedicoFiltro[]> {
    const query = `
;WITH MedicosAtendieron AS (
    SELECT DISTINCT pr.IdMedico
    FROM Atenciones a
    INNER JOIN Citas c ON c.IdAtencion = a.IdAtencion
    INNER JOIN ProgramacionMedica pr ON pr.IdProgramacion = c.IdProgramacion
    LEFT JOIN Especialidades esp ON esp.IdEspecialidad = a.IdEspecialidadMedico
    WHERE a.FyHFinal IS NOT NULL
        AND a.IdTipoServicio = 1
        AND a.FyHFinal >= @FECHAINICIO
        AND a.FyHFinal < DATEADD(DAY, 1, @FECHAFIN)
        AND (@DEPARTAMENTO_ID IS NULL OR esp.IdDepartamento = @DEPARTAMENTO_ID)
        AND (@ESPECIALIDAD_ID IS NULL OR esp.IdEspecialidad = @ESPECIALIDAD_ID)
        AND (@TURNO IS NULL OR @TURNO = 'Todos' OR CASE WHEN CAST(pr.HoraInicio AS TIME) >= '07:00:00' AND CAST(pr.HoraInicio AS TIME) < '14:00:00' THEN 'M' ELSE 'T' END = @TURNO)
)
SELECT DISTINCT
    m.IdMedico,
    COALESCE(e.ApellidoPaterno, '') + ' ' +
    COALESCE(e.ApellidoMaterno, '') + ' ' +
    COALESCE(e.Nombres, '') AS Medico,
    te.Descripcion AS TipoEmpleado
FROM Medicos m
INNER JOIN Empleados e ON e.IdEmpleado = m.IdEmpleado
LEFT JOIN TiposEmpleado te ON te.IdTipoEmpleado = e.IdTipoEmpleado
LEFT JOIN MedicosAtendieron ma ON ma.IdMedico = m.IdMedico
WHERE e.IdEmpleado <> 3766
    AND (@MEDICO_ID IS NULL OR m.IdMedico = @MEDICO_ID)
    AND (@MEDICO_ID IS NOT NULL OR ma.IdMedico IS NOT NULL)
ORDER BY Medico ASC
`;
    const result = await executeQuery<MedicoFiltro>(query, {
      FECHAINICIO: { type: mssql.Date, value: fechaInicio },
      FECHAFIN: { type: mssql.Date, value: fechaFin },
      DEPARTAMENTO_ID: { type: mssql.Int, value: filters.departamentoId ?? null },
      ESPECIALIDAD_ID: { type: mssql.Int, value: filters.especialidadId ?? null },
      MEDICO_ID: { type: mssql.Int, value: filters.medicoId ?? null },
      TURNO: { type: mssql.NVarChar(1), value: filters.turno ?? null },
    });
    return result.recordset;
  }

  async getProduccionConsultaExterna(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters = {}
  ): Promise<ProduccionDiaria[]> {
    const diasPivot = obtenerDiasPivot(fechaInicio, fechaFin);
    if (diasPivot.length === 0) return [];

    const columnasSelect = diasPivot
      .map((dia) => `CAST([${dia.clave}] AS VARCHAR) AS [${dia.clave}]`)
      .join(',\n        ');

    const columnasTotal = diasPivot
      .map((dia) => `ISNULL([${dia.clave}], 0)`)
      .join(' + ');

    const columnasPivot = diasPivot
      .map((dia) => `[${dia.clave}]`)
      .join(', ');

    const query = `
SELECT
    Medico,
    TipoEmpleado,
    Especialidad,
    Turno,
    ${columnasSelect},
    (${columnasTotal}) AS TOTAL
FROM (
    SELECT
        COALESCE(e.ApellidoPaterno, '') + ' ' +
        COALESCE(e.ApellidoMaterno, '') + ' ' +
        COALESCE(e.Nombres, '') AS Medico,
        te.Descripcion AS TipoEmpleado,
        COALESCE(esp.Nombre, 'SIN ESPECIALIDAD') AS Especialidad,
        CASE
            WHEN CAST(pr.HoraInicio AS TIME) >= '07:00:00'
             AND CAST(pr.HoraInicio AS TIME) < '14:00:00' THEN 'M'
            ELSE 'T'
        END AS Turno,
        CASE
            WHEN @DIA_CON_MES = 1
            THEN RIGHT('0' + CAST(MONTH(pr.fecha) AS VARCHAR(2)), 2) + '-' +
                 RIGHT('0' + CAST(DAY(pr.fecha) AS VARCHAR(2)), 2)
            ELSE RIGHT('0' + CAST(DAY(pr.fecha) AS VARCHAR(2)), 2)
        END AS Dia,
        COUNT(CASE WHEN a.FyHFinal IS NOT NULL THEN a.IdAtencion END) AS Cantidad
    FROM ProgramacionMedica pr
    LEFT JOIN Citas c
        ON c.IdProgramacion = pr.IdProgramacion
    LEFT JOIN Atenciones a
        ON a.IdAtencion = c.IdAtencion
        AND a.IdTipoServicio = 1
    LEFT JOIN Medicos m
        ON m.IdMedico = pr.IdMedico
    INNER JOIN Empleados e
        ON e.IdEmpleado = m.IdEmpleado
    LEFT JOIN TiposEmpleado te
        ON te.IdTipoEmpleado = e.IdTipoEmpleado
    LEFT JOIN Especialidades esp
        ON esp.IdEspecialidad = pr.IdEspecialidad
    WHERE pr.fecha >= @FECHAINICIO
      AND pr.fecha < DATEADD(DAY, 1, @FECHAFIN)
      AND e.IdEmpleado <> 3766
      AND (@DEPARTAMENTO_ID IS NULL OR esp.IdDepartamento = @DEPARTAMENTO_ID)
      AND (@ESPECIALIDAD_ID IS NULL OR esp.IdEspecialidad = @ESPECIALIDAD_ID)
      AND (@MEDICO_ID IS NULL OR m.IdMedico = @MEDICO_ID)
      AND (@TURNO IS NULL OR @TURNO = 'Todos' OR
           CASE WHEN CAST(pr.HoraInicio AS TIME) >= '07:00:00'
                 AND CAST(pr.HoraInicio AS TIME) < '14:00:00'
                THEN 'M' ELSE 'T' END = @TURNO)
    GROUP BY
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.Nombres,
        te.Descripcion,
        esp.Nombre,
        pr.IdEspecialidad,
        pr.HoraInicio,
        pr.fecha
) src
PIVOT (
    SUM(Cantidad)
    FOR Dia IN (${columnasPivot})
) p
ORDER BY Medico, Especialidad
`;

    const result = await executeQuery<ProduccionDiaria>(query, {
      FECHAINICIO: { type: mssql.Date, value: fechaInicio },
      FECHAFIN: { type: mssql.Date, value: fechaFin },
      DIA_CON_MES: { type: mssql.Int, value: diasPivot[0]?.clave.includes('-') ? 1 : 0 },
      DEPARTAMENTO_ID: { type: mssql.Int, value: filters.departamentoId ?? null },
      ESPECIALIDAD_ID: { type: mssql.Int, value: filters.especialidadId ?? null },
      MEDICO_ID: { type: mssql.Int, value: filters.medicoId ?? null },
      TURNO: { type: mssql.NVarChar(1), value: filters.turno ?? null },
    });
    return result.recordset;
  }

  async getCurvaCargaPacientes(
    fechaInicio: string,
    fechaFin: string,
    filters: ProduccionConsultaFilters = {}
  ): Promise<Array<{ dia: string; atenciones: number }>> {
    const dias = obtenerDiasEntreFechas(fechaInicio, fechaFin);
    const query = `
SELECT
    RIGHT('0' + CAST(DAY(pr.fecha) AS VARCHAR(2)), 2) AS dia,
    COUNT(a.IdAtencion) AS atenciones
FROM ProgramacionMedica pr
INNER JOIN Citas c ON c.IdProgramacion = pr.IdProgramacion
INNER JOIN Atenciones a ON a.IdAtencion = c.IdAtencion
LEFT JOIN Especialidades esp ON esp.IdEspecialidad = a.IdEspecialidadMedico
WHERE a.FyHFinal IS NOT NULL
    AND a.IdTipoServicio = 1
    AND pr.fecha >= @fechaInicio
    AND pr.fecha < DATEADD(DAY, 1, @fechaFin)
    AND (@DEPARTAMENTO_ID IS NULL OR esp.IdDepartamento = @DEPARTAMENTO_ID)
    AND (@ESPECIALIDAD_ID IS NULL OR esp.IdEspecialidad = @ESPECIALIDAD_ID)
    AND (@MEDICO_ID IS NULL OR EXISTS (
        SELECT 1 FROM ProgramacionMedica pr2
        WHERE pr2.IdProgramacion = pr.IdProgramacion
          AND pr2.IdMedico = @MEDICO_ID
    ))
    AND (@TURNO IS NULL OR @TURNO = 'Todos' OR
         CASE WHEN CAST(pr.HoraInicio AS TIME) >= '07:00:00'
               AND CAST(pr.HoraInicio AS TIME) < '14:00:00'
              THEN 'M' ELSE 'T' END = @TURNO)
GROUP BY DAY(pr.fecha)
ORDER BY DAY(pr.fecha) ASC
`;
    const result = await executeQuery<{ dia: string; atenciones: number }>(query, {
      fechaInicio: { type: mssql.Date, value: fechaInicio },
      fechaFin: { type: mssql.Date, value: fechaFin },
      DEPARTAMENTO_ID: { type: mssql.Int, value: filters.departamentoId ?? null },
      ESPECIALIDAD_ID: { type: mssql.Int, value: filters.especialidadId ?? null },
      MEDICO_ID: { type: mssql.Int, value: filters.medicoId ?? null },
      TURNO: { type: mssql.NVarChar(1), value: filters.turno ?? null },
    });
    const porDia = new Map(result.recordset.map((item) => [item.dia, item.atenciones]));
    return dias.map((dia) => ({
      dia: String(Number(dia)),
      atenciones: porDia.get(dia) || 0,
    }));
  }
}