import { Empleado } from './empleado';

export interface LoginResponse {
  success: boolean;
  mensaje?: string;
  usuario?: {
    id: number;
    nombre: string;
    usuario: string;
  };
}
