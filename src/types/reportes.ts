export interface ReporteKpi {
  id: string;
  titulo: string;
  valor: string | number;
  cambio: string;
  esPositivo: boolean;
  icono: string;
}

export interface ProductividadMes {
  mes: string;
  consultas: number;
  cirugias: number;
  emergencias: number;
}
