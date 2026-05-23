export interface Empleado {
  IdEmpleado: number;
  Nombre: string;
  Usuario: string;
  Password?: string;
  esActivo: number | boolean; // 0 o 1, o boolean de mssql bit
  Rol?: string;
  Cargo?: string;
  Departamento?: string;
}
