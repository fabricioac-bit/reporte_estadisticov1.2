import { cookies } from 'next/headers';
import { JWTPayload, signJWT, verifyJWT } from './jwt';

const COOKIE_NAME = 'sigh_session';

export async function setSession(payload: JWTPayload): Promise<void> {
  const token = signJWT(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
  //secure: process.env.NODE_ENV === 'production',
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });
}

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie) return null;
    return verifyJWT(cookie.value);
  } catch (error) {
    return null;
  }
}

export async function removeSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
