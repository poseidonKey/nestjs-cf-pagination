import { AccessTokenGuard } from './../auth/guard/bearer-token.guard'
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'

import { PostsService } from './posts.service'
import { User } from 'src/users/decorator/user.decorator'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { PaginatePostDto } from './dto/paginate-post.dto'
import { UsersModel } from 'src/users/entities/users.entity'

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query)
    // return this.postsService.getAllPosts()
  }

  @Post('random')
  @UseGuards(AccessTokenGuard)
  async postPostsRandom(@User() user: UsersModel) {
    await this.postsService.generatePost(user.id)
    return true
  }

  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id)
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  postPosts(
    // @User() user: UsersModel,
    @User('id') userId: number,
    // @Request() req: any,

    // @Body('authorId')
    // authorId: number,
    @Body() body: CreatePostDto
    // @Body('title') title: string,
    // @Body('content') content: string
    // @Body('isPublic', new DefaultValuePipe(true)) isPublic: boolean
  ) {
    // const authorId = req.user.id
    return this.postsService.createPost(userId, body)
  }

  @Patch(':id')
  patchPost(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePostDto) {
    this.postsService.updatePost(id, body)
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    this.postsService.deletePost(id)
  }
}
