import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { changePasswordSchema } from '@/lib/validations';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, mensaje: 'No se encontró sesión activa.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, mensaje: 'Datos de entrada inválidos.' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = validation.data;
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, mensaje: 'La nueva contraseña y su confirmación no coinciden.' },
        { status: 400 }
      );
    }

    const authService = new AuthService();
    const result = await authService.changePassword(session.usuario, currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API ChangePassword] Error:', error.message);
    return NextResponse.json(
      { success: false, mensaje: 'Error interno en el servidor.' },
      { status: 500 }
    );
  }
}
