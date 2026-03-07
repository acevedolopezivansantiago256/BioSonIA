import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
let prisma: PrismaClient | null = null;
const dbDisabled = process.env.DISABLE_DB === 'true' || !process.env.DATABASE_URL;

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async register(email: string, password: string) {
    if (dbDisabled) {
      // Modo sin BD: aceptar registro y devolver un usuario demo
      return { ok: true, user: { id: 'demo', email } };
    }
    const client = prisma ?? (prisma = new PrismaClient());
    const exists = await client.user.findUnique({ where: { email } });
    if (exists) return { ok: false, message: 'Email ya registrado' };
    const hash = await bcrypt.hash(password, 10);
    const user = await client.user.create({ data: { email, passwordHash: hash } });
    return { ok: true, user: { id: user.id, email: user.email } };
  }

  async login(email: string, password: string) {
    if (dbDisabled) {
      // Modo sin BD: generar tokens directos para el email proporcionado
      const accessToken = await this.jwt.signAsync({ sub: 'demo', email });
      const refreshToken = await this.jwt.signAsync({ sub: 'demo' }, { expiresIn: '7d' });
      return { ok: true, accessToken, refreshToken };
    }
    const client = prisma ?? (prisma = new PrismaClient());
    const user = await client.user.findUnique({ where: { email } });
    if (!user) return { ok: false, message: 'Credenciales inválidas' };
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return { ok: false, message: 'Credenciales inválidas' };
    const accessToken = await this.jwt.signAsync({ sub: user.id, email });
    // Refresh token simplificado (opcional)
    const refreshToken = await this.jwt.signAsync({ sub: user.id }, { expiresIn: '7d' });
    return { ok: true, accessToken, refreshToken };
  }
}
