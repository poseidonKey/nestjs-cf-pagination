import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common'
import { AuthService } from '../auth.service'
import { UsersService } from 'src/users/users.service'

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const rawToken = req.headers['authorization']
    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다.')
    }
    const token = this.authService.extractTokenFromHeader(rawToken, true)
    const result = await this.authService.verifyToken(token)

    const user = await this.usersService.getUserByEmail(result.email)
    req.user = user
    req.token = token
    req.type = result.type

    return true
  }
}
@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)

    const req = context.switchToHttp().getRequest()
    if (req.type !== 'access') {
      throw new UnauthorizedException('엑세스 토큰이 아닙니다. ')
    }
    return true
  }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)

    const req = context.switchToHttp().getRequest()
    if (req.type !== 'refresh') {
      throw new UnauthorizedException('refresh 토큰이 아닙니다. ')
    }
    return true
  }
}
