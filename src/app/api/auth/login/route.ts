import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { loginSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validar esquema Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, mensaje: 'Datos de entrada inválidos.' },
        { status: 400 }
      );
    }

    const { usuario, password } = validation.data;
    
    const authService = new AuthService();
    const result = await authService.login(usuario, password);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API Login] Error:', error.message);
    return NextResponse.json(
      { success: false, mensaje: 'Error interno en el servidor.' },
      { status: 500 }
    );
  }
}
