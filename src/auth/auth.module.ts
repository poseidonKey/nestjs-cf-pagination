import { Module, forwardRef } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { UsersModule } from 'src/users/users.module'
import { PostsModule } from 'src/posts/posts.module'

@Module({
  imports: [JwtModule.register({}), forwardRef(() => UsersModule), forwardRef(() => PostsModule)],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}
