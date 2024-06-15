import { ExecutionContext, InternalServerErrorException, createParamDecorator } from '@nestjs/common'
import { UsersModel } from '../entities/users.entity'

export const User = createParamDecorator((data: keyof UsersModel | undefined, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest()
  const user = req.user as UsersModel
  if (!user) {
    throw new InternalServerErrorException('request 에 user 프로퍼티가 존재하지 않습니다.')
  }

  if (data) {
    return user[data]
  }
  return user
})
