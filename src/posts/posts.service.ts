import { HOST } from './../common/const/env.const'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsOrderValue, FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm'
import { PostModel } from './entities/posts.entity'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { PaginatePostDto } from './dto/paginate-post.dto'
import { PROTOCOL } from 'src/common/const/env.const'
import { CommonService } from 'src/common/common.service'

// export interface PostModel {
//   id: number;
//   author: string;
//   title: string;
//   content: string;
//   likeCount: number;
//   commentCount: number;
// }
// const posts: PostModel[] = [
//   {
//     id: 1,
//     author: 'newjeans',
//     title: 'New minji',
//     content: 'Content',
//     likeCount: 100,
//     commentCount: 10,
//   },
//   {
//     id: 2,
//     author: 'newjeans-',
//     title: 'New minji-',
//     content: 'Content',
//     likeCount: 100,
//     commentCount: 10,
//   },
//   {
//     id: 3,
//     author: 'newjeans--',
//     title: 'New minji--',
//     content: 'Content--',
//     likeCount: 100,
//     commentCount: 10,
//   },
// ];

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostModel)
    private readonly postRepository: Repository<PostModel>,
    private readonly commonService: CommonService
  ) {}

  async getAllPosts() {
    return await this.postRepository.find({
      relations: ['author']
    })
  }

  async generatePost(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임의로 생성된 포스트 제목 ${i}`,
        content: `임의로 생성된 포스트 내용 ${i}`
      })
    }
  }

  async paginatePosts(dto: PaginatePostDto) {
    // if (dto.page) {
    //   return this.pagePaginatePost(dto)
    // } else {
    //   return this.cursorPaginatePosts(dto)
    // }
    return this.commonService.paginate(dto, this.postRepository, {}, 'posts')
  }
  async pagePaginatePost(dto: PaginatePostDto) {
    /**
     * data:Data[]
     * total : number
     * [1] [2][3][4]...
     */
    // total은 전체 post의 갯수
    const [posts, count] = await this.postRepository.findAndCount({
      order: {
        createdAt: dto.order__createdAt
      },
      take: dto.take,
      skip: dto.take * (dto.page - 1)
    })
    return {
      data: posts,
      total: count
    }
  }

  async cursorPaginatePosts(dto: PaginatePostDto) {
    const where: FindOptionsWhere<PostModel> = {}
    if (dto.where__id__less_than) {
      where.id = LessThan(dto.where__id__less_than)
    } else if (dto.where__id__more_than) {
      where.id = MoreThan(dto.where__id__more_than)
    }

    const posts = await this.postRepository.find({
      where,
      order: {
        createdAt: dto.order__createdAt as FindOptionsOrderValue
      },
      take: dto.take
    })

    const lastItem = posts.length > 0 ? posts[posts.length - 1] : null
    // const lastItem = posts.length > 0 && posts.length === dto.take ? posts[posts.length - 1] : null
    const nextUrl = lastItem && new URL(`${PROTOCOL}://${HOST}/posts`)
    if (nextUrl) {
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (key !== 'where__id__more_than' && key !== 'where__id_less_than') {
            nextUrl.searchParams.append(key, dto[key])
          }
        }
      }
    }

    let key = null
    if (dto.order__createdAt === 'ASC') {
      key = 'where__id__more_than'
    } else {
      key = 'where__id__less_than'
    }
    nextUrl.searchParams.append(key, lastItem.id.toString())

    return {
      data: posts,
      cursor: {
        after: lastItem?.id ?? null
      },
      count: posts.length,
      next: nextUrl?.toString() ?? null
    }
  }

  async getPostById(id: number) {
    const post = await this.postRepository.findOne({
      where: {
        id
      },
      relations: ['author']
    })
    if (!post) {
      return new NotFoundException()
    }
    return post
  }

  async createPost(authorId: number, postDto: CreatePostDto) {
    const post = this.postRepository.create({
      author: {
        id: authorId
      },
      ...postDto,
      likeCount: 0,
      commentCount: 0
    })
    const newPost = await this.postRepository.save(post)
    return newPost
  }

  async updatePost(postId: number, postDto: UpdatePostDto) {
    const post = await this.postRepository.findOne({
      where: {
        id: postId
      }
    })
    // const post = posts.find((post) => post.id === postId);
    if (!post) {
      throw new NotFoundException()
    }
    const { title, content } = postDto
    if (title) {
      post.title = title
    }
    if (content) {
      post.content = content
    }
    const newPost = await this.postRepository.save(post)
    return newPost
  }

  async deletePost(postId: number) {
    const post = await this.postRepository.findOne({
      where: {
        id: postId
      }
    })
    if (!post) {
      throw new NotFoundException()
    }
    await this.postRepository.delete(postId)

    return postId
  }
}
