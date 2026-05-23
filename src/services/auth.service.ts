import bcrypt from 'bcryptjs';
import { AuthRepository } from '../repositories/auth.repository';
import { setSession, removeSession } from '../lib/auth';
import { LoginResponse } from '../types/auth';

export class AuthService {
  private authRepository = new AuthRepository();

  async login(usuario: string, contrasenia: string): Promise<LoginResponse> {
    try {
      const user = await this.authRepository.findByUsuario(usuario);

      // Si no existe el usuario
      if (!user) {
        return {
          success: false,
          mensaje: 'Credenciales incorrectas',
        };
      }

      // Validar si el usuario está activo (esActivo = 1 o true)
      const isActive = user.esActivo === 1 || user.esActivo === true || String(user.esActivo) === 'true' || String(user.esActivo) === '1';
      if (!isActive) {
        return {
          success: false,
          mensaje: 'Usuario inactivo',
        };
      }

      // Comparar contraseña encriptada usando bcryptjs
      const isMatch = await bcrypt.compare(contrasenia, user.Password || '');
      if (!isMatch) {
        return {
          success: false,
          mensaje: 'Credenciales incorrectas',
        };
      }

      const payload = {
        id: user.IdEmpleado,
        nombre: user.Nombre,
        usuario: user.Usuario,
      };

      // Guardar sesión segura en las cookies
      await setSession(payload);

      return {
        success: true,
        usuario: payload,
      };
    } catch (error: any) {
      console.error('[AuthService] Error durante login:', error.message);
      
      // Manejo específico si hay problemas de base de datos
      if (error.message.includes('base de datos') || error.message.includes('Pool') || error.message.includes('connection')) {
        return {
          success: false,
          mensaje: 'Error de conexión con la base de datos SQL. Reintentando de forma resiliente...',
        };
      }

      return {
        success: false,
        mensaje: 'Error interno en el servidor.',
      };
    }
  }

  async logout(): Promise<void> {
    await removeSession();
  }

  async changePassword(usuario: string, contraseniaActual: string, contraseniaNueva: string): Promise<{ success: boolean; mensaje?: string }> {
    try {
      const user = await this.authRepository.findByUsuario(usuario);

      if (!user) {
        return { success: false, mensaje: 'Usuario no encontrado.' };
      }

      const isActive = user.esActivo === 1 || user.esActivo === true || String(user.esActivo) === 'true' || String(user.esActivo) === '1';
      if (!isActive) {
        return { success: false, mensaje: 'Usuario inactivo.' };
      }

      const isMatch = await bcrypt.compare(contraseniaActual, user.Password || '');
      if (!isMatch) {
        return { success: false, mensaje: 'La contraseña actual es incorrecta.' };
      }

      const hashedPassword = await bcrypt.hash(contraseniaNueva, 10);
      await this.authRepository.updatePassword(user.IdEmpleado, hashedPassword);

      return {
        success: true,
        mensaje: 'Contraseña actualizada correctamente.',
      };
    } catch (error: any) {
      console.error('[AuthService] Error al cambiar contraseña:', error.message);
      return {
        success: false,
        mensaje: 'Error interno al actualizar la contraseña.',
      };
    }
  }
}
