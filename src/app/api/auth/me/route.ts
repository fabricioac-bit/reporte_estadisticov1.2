import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, mensaje: 'No se encontró sesión activa.' }, { status: 401 });
  }

  return NextResponse.json({ success: true, usuario: session });
}
