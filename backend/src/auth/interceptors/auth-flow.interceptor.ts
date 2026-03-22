import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable()
export class AuthFlowInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = String(request?.route?.path || '');
    const method = String(request?.method || '').toUpperCase();
    const body = request?.body || {};
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (method === 'POST' && (path === 'register' || path === 'login')) {
      if (!email || !password) {
        throw new BadRequestException('email y password son requeridos');
      }
    }

    return next.handle().pipe(
      mergeMap((data) => from(this.transformResponse(path, data))),
    );
  }

  private async transformResponse(path: string, data: any) {
    const ok = Boolean(data?.ok);
    if (!ok) {
      const message = data?.message || 'Operación de autenticación fallida';
      if (path === 'register') {
        throw new ConflictException(message);
      }
      throw new UnauthorizedException(message);
    }

    if (path === 'register') {
      return {
        ok: true,
        user: data.user,
      };
    }

    return data;
  }
}
