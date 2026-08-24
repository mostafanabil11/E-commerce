import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { User, UserDocument } from '../../DB/Models/user.model';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // The frontend sends a bare `token:` header; API clients and Swagger send
    // `Authorization: Bearer <jwt>`. Accept either.
    const authHeader = request.headers.authorization;
    const tokenHeader = request.headers['token'];

    const token = authHeader
      ? authHeader.replace(/^Bearer\s+/i, '').trim()
      : Array.isArray(tokenHeader)
        ? tokenHeader[0]?.trim()
        : tokenHeader?.trim();

    if (!token) {
      throw new UnauthorizedException({ message: 'Missing authentication token' });
    }

    try {
      const payload = this.jwtService.verify<{ id: string; role: string; iat?: number }>(
        token,
        { secret: this.configService.get<string>('JWT_SECRET') },
      );

      const cacheKey = `user:credentials:${payload.id}`;
      let cachedUser: { id: string; role: string; changeCredentialsTime?: string } | null = null;

      if (this.redisService) {
        try {
          cachedUser = await this.redisService.get(cacheKey);
        } catch {
          cachedUser = null;
        }
      }

      let changeCredentialsTime: Date | undefined;
      let role = payload.role;

      if (cachedUser) {
        role = cachedUser.role || payload.role;
        changeCredentialsTime = cachedUser.changeCredentialsTime
          ? new Date(cachedUser.changeCredentialsTime)
          : undefined;
      } else {
        const user = await this.userModel.findById(payload.id);
        if (!user) {
          throw new UnauthorizedException({ message: 'User not found' });
        }
        changeCredentialsTime = user.changeCredentialsTime;
        role = user.role;

        if (this.redisService) {
          try {
            await this.redisService.set(
              cacheKey,
              {
                id: user._id.toString(),
                role: user.role,
                changeCredentialsTime: user.changeCredentialsTime?.toISOString(),
              },
              900,
            );
          } catch {
          }
        }
      }

      if (changeCredentialsTime && payload.iat) {
        const changeTimeSeconds = Math.floor(
          changeCredentialsTime.getTime() / 1000,
        );
        if (changeTimeSeconds > payload.iat) {
          throw new UnauthorizedException({
            message: 'Token has been invalidated due to logout or password change. Please log in again.',
          });
        }
      }

      request['user'] = { ...payload, id: payload.id, role };
      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException({ message: 'Invalid or expired token' });
    }
  }
}


