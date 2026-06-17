export interface TriajeRegistro {
  Paciente: string;
  DniPaciente: string;
  AreaTriaje: string;
  FechaTriaje: string;
  HoraTriaje: string;
  TriajeTalla: string;
  TriajePeso: string;
  IMC: number;
  EstadoNutricional: string;
}

export interface TriajeTablaItem {
  id: number;
  paciente: string;
  dniPaciente: string;
  areaTriaje: string;
  fechaTriaje: string;
  horaTriaje: string;
  talla: number;
  peso: number;
  imc: number;
  estadoNutricional: string;
}

export interface TriajeKPIs {
  totalMes: number;
  delgado: number;
  normal: number;
  sobrepeso: number;
  obesidadTotal: number;
}

export interface TriajeResponse {
  periodoMostrado: {
    desde: string;
    hasta: string;
  };
  kpis: TriajeKPIs;
  grafico: Array<{ estado: string; pacientes: number }>;
  tabla: TriajeTablaItem[];
}

export interface ParamsTriaje {
  fechaInicio: string;
  fechaFin: string;
  estadoNutricional?: string;
  paciente?: string;
  dniPaciente?: string;
  servicio?: string;
}
