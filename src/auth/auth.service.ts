// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UsersService } from './../users/users.service'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersModel } from 'src/users/entities/users.entity'
import { HASH_ROUNDS, JWT_SECRET } from './const/auth.const'
import * as bcrypt from 'bcrypt'
import { RegisterUserDto } from './guard/dto/register-user.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly UsersService: UsersService
  ) {}

  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access'
    }
    return this.jwtService.sign(payload, { secret: JWT_SECRET, expiresIn: isRefreshToken ? 3600 : 300 })
  }
  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true)
    }
  }

  async authenticateWithEmailAndPassword(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.UsersService.getUserByEmail(user.email)
    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않는 사용자 입니다.')
    }
    const passOk = await bcrypt.compare(user.password, existingUser.password)
    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.')
    }
    return existingUser
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user)
    return this.loginUser(existingUser)
  }

  async registerWithEmail(user: RegisterUserDto) {
    const hash = await bcrypt.hash(user.password, HASH_ROUNDS)
    const newUser = await this.UsersService.createUser({ ...user, password: hash })
    return this.loginUser(newUser)
  }

  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ')
    const prefix = isBearer ? 'Bearer' : 'Basic'
    if (splitToken.length !== 2 || splitToken[0] != prefix) {
      throw new UnauthorizedException('잘못 된 토큰입니다.')
    }
    const token = splitToken[1]
    return token
  }

  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8')
    const split = decoded.split(':')
    if (split.length !== 2) {
      throw new UnauthorizedException('잘못 된 유형의 토큰입니다.')
    }
    const email = split[0]
    const password = split[1]
    return {
      email,
      password
    }
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: JWT_SECRET
      })
    } catch (error) {
      throw new UnauthorizedException('토큰이 만료 됐거나 잘못 된 토큰 입니다.')
    }
  }

  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: JWT_SECRET
    })
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('토큰 재 발급은 refresh 토큰으로만 가능합니다')
    }
    return this.signToken(
      {
        ...decoded
      },
      isRefreshToken
    )
  }
}
