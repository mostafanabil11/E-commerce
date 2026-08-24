import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Uploaded files are stored as root-relative paths (`/uploads/...`) so the
 * database stays portable across environments. Clients render them directly in
 * <img> tags, so they are expanded to absolute URLs on the way out.
 *
 * The base comes from PUBLIC_URL when set, otherwise it is derived from the
 * incoming request.
 */
@Injectable()
export class AbsoluteUrlInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const base = (
      this.configService.get<string>('PUBLIC_URL') ||
      `${request.protocol}://${request.get('host') ?? ''}`
    ).replace(/\/+$/, '');

    return next.handle().pipe(map((body) => this.expand(body, base)));
  }

  private expand(value: unknown, base: string): unknown {
    if (typeof value === 'string') {
      return value.startsWith('/uploads/') ? `${base}${value}` : value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.expand(item, base));
    }

    if (value === null || typeof value !== 'object') return value;

    // Dates and ObjectIds serialise themselves; leave them alone.
    if (value instanceof Date) return value;

    // Mongoose documents are class instances: convert to their JSON form first
    // so virtuals are applied and the result is a plain object to walk.
    const maybeDoc = value as { toJSON?: () => unknown };
    if (typeof maybeDoc.toJSON === 'function') {
      const plain = maybeDoc.toJSON();
      // Guard against toJSON returning a primitive (ObjectId does this).
      if (typeof plain !== 'object' || plain === null) return plain;
      return this.expand(plain, base);
    }

    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = this.expand(item, base);
    }
    return result;
  }
}
