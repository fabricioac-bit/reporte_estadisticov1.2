// Tipos para Atenciones en Emergencia

export interface AtencionEmergenciaKPIs {
  totalMes: number;
  noAtendidos: number;
  eliminados: number;
  turnoMayorDemanda: string;
  altaEnServicio: number;
  sinAlta: number;
}

export interface DatosGrafico {
  servicio?: string;
  idServicio?: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  pacientes: number;
}

export interface DatosTurno {
  turno: string;
  pacientes: number;
}

export interface FilaTablaServicio {
  id: number;
  servicio: string;
  pacientes: number;
  fugas: number;
  anulados: number;
  turnoCritico: string;
}

export interface FilaTableMedicos {
  IdTipoServicio: number;
  TipoServicio: string;
  IdServicio: number;
  Servicio: string;
  IdMedico: number | null;
  Medico: string | null;
  Turno: string;
  AtendidosReal: number;
  FugasReal: number;
  TotalAnulados: number;
}

export interface RespuestaAtencionesEmergencia {
  kpis: AtencionEmergenciaKPIs;
  grafico: DatosGrafico[];
  turnos: DatosTurno[];
  tabla: FilaTablaServicio[] | FilaTableMedicos[];
  resumenDemanda: string;
}

export interface ParamsFiltroAtenciones {
  fechaInicio: string;
  fechaFin: string;
  servicio: string;
  prioridad?: string;
  turno?: string;
}
