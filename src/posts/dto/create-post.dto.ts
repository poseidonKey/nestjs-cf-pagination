import { PickType } from '@nestjs/mapped-types'
import { PostModel } from '../entities/posts.entity'

export class CreatePostDto extends PickType(PostModel, ['title', 'content']) {}
