import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hospital_jwt_key_2026_bb9410dc';

export interface JWTPayload {
  id: number;
  nombre: string;
  usuario: string;
}

export function signJWT(payload: JWTPayload, expiresIn: string = '8h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
