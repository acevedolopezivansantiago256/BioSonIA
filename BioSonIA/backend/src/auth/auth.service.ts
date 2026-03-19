import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async register(email: string, password: string) {
    if (process.env.DISABLE_DB === 'true') {
      return { ok: true, user: { id: 'demo', email } };
    }
    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) return { ok: false, message: 'Email ya registrado' };
    
    // El hash de la contraseña se hace automáticamente mediante @BeforeInsert en la entidad User
    const user = this.userRepository.create({ email, passwordHash: password });
    await this.userRepository.save(user);
    
    return { ok: true, user: { id: user.id, email: user.email } };
  }

  async login(email: string, password: string) {
    if (process.env.DISABLE_DB === 'true') {
      const accessToken = await this.jwt.signAsync({ sub: 'demo', email });
      const refreshToken = await this.jwt.signAsync({ sub: 'demo' }, { expiresIn: '7d' });
      return { ok: true, accessToken, refreshToken };
    }
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return { ok: false, message: 'Credenciales inválidas' };
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return { ok: false, message: 'Credenciales inválidas' };
    
    const accessToken = await this.jwt.signAsync({ sub: user.id, email });
    const refreshToken = await this.jwt.signAsync({ sub: user.id }, { expiresIn: '7d' });
    return { ok: true, accessToken, refreshToken };
  }
}
