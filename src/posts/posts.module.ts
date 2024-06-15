import { Module, forwardRef } from '@nestjs/common'
import { PostsService } from './posts.service'
import { PostsController } from './posts.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PostModel } from './entities/posts.entity'
import { AuthModule } from 'src/auth/auth.module'
import { AccessTokenGuard, RefreshTokenGuard } from 'src/auth/guard/bearer-token.guard'
import { UsersModule } from 'src/users/users.module'

@Module({
  imports: [TypeOrmModule.forFeature([PostModel]), forwardRef(() => AuthModule), UsersModule],
  controllers: [PostsController],
  providers: [PostsService, AccessTokenGuard, RefreshTokenGuard]
})
export class PostsModule {}
