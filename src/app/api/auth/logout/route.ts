import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST() {
  const authService = new AuthService();
  await authService.logout();
  return NextResponse.json({ success: true, mensaje: 'Sesión cerrada exitosamente.' });
}
