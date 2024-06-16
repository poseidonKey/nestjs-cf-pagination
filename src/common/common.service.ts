import { BadRequestException, Injectable } from '@nestjs/common'
import { BasePaginationDto } from './dto/base-pagination.dto'
import { FindManyOptions, FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm'
import { BaseModel } from './entity/base.entity'
import { FILTER_MAPPER } from './const/filter-mapper.const'
import { HOST, PROTOCOL } from './const/env.const'

@Injectable()
export class CommonService {
  paginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string
  ) {
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions)
    } else {
      return this.cursorPaginate(dto, repository, overrideFindOptions, path)
    }
  }

  private async pagePaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {}
  ) {
    const findOptions = this.composeFindOptions<T>(dto)
    const [data, count] = await repository.findAndCount({
      ...findOptions,
      ...overrideFindOptions
    })
    return {
      data,
      total: count
    }
  }

  private async cursorPaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string
  ) {
    /**
     * where__likeCount_more_than
     *
     * where__title__ilike 등의 구현
     */
    const findOptions = this.composeFindOptions<T>(dto)
    const results = await repository.find({
      ...findOptions,
      ...overrideFindOptions
    })

    const lastItem = results.length > 0 ? results[results.length - 1] : null
    // const lastItem = posts.length > 0 && posts.length === dto.take ? posts[posts.length - 1] : null
    const nextUrl = lastItem && new URL(`${PROTOCOL}://${HOST}/${path}`)
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
      data: results,
      cursor: {
        after: lastItem?.id ?? null
      },
      count: results.length,
      next: nextUrl?.toString() ?? null
    }
  }

  private composeFindOptions<T extends BaseModel>(dto: BasePaginationDto): FindManyOptions<T> {
    /**
     * 반환 값
     * where
     * order,
     * take
     * skip -> page 기반일 때만
     */
    /**
     * DTO의 현재 구조는
     * {
     *  where__id__more_than
     * order__createdAt: 'ASC'
     * 또 여러개가 올 수도 있다.
     *
     * likeCount 나 title__ilike 등도 추가해야 한다.
     *
     * }
     * 1.where로 시작한다면 필터 로직을 적용
     * 2. order로 시작한다면 정렬 로직 적용
     * 3. 필터 로직 적용한다면 '__' 기준으로 split 했을 때 3개의 값으로 나뉘는지, 2개 값으로
     * 나뉘는지 확인
     *  3-1. 3개의 값으로 나뉜다면 FILTER_MAPPER에서 해당되는 operator 함수를 찾아 적용
     *      ['where', 'id', 'more_than]
     *  3-2. 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에 operator 없이 적용
     *      ['where', 'id']
     * 4. order의 경우는 3-2와 같이 적용
     */
    let where: FindOptionsWhere<T> = {}
    let order: FindOptionsOrder<T> = {}
    for (const [key, value] of Object.entries(dto)) {
      if (key.startsWith('where__')) {
        where = { ...where, ...this.parseWhereFilter(key, value) }
      } else if (key.startsWith('order__')) {
        order = { ...order, ...this.parseWhereFilter(key, value) }
      }
    }
    return {
      where,
      order,
      take: dto.page,
      skip: dto.page ? dto.take * (dto.page - 1) : null
    }
  }
  private parseWhereFilter<T extends BaseModel>(key: string, value: any): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {}

    const split = key.split('__')
    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(`where 필터는 split 했을 때 길이가 2 또는 3이어야 합니다. 문제 되는 키값 : ${key}`)
    }
    if (split.length == 2) {
      const [_, field] = split
      options[field] = value
    } else {
      const [_, field, operator] = split

      // where__id__between = 3,4
      // 만약에 split 대상 문자가 존재하지 않으면 길이가 무조건 1이다.
      // const values = value.toString().split(',')

      // field -> id
      // operator -> more_than
      // FILTER_MAPPER[operator] -> MoreThan
      // if(operator === 'between'){
      //     options[field] = FILTER_MAPPER[operator](values[0], values[1]);
      // }else{
      //     options[field] = FILTER_MAPPER[operator](value);
      // }
      // if (operator === 'i_like') {
      //   options[field] = FILTER_MAPPER[operator](`%${value}%`)
      // } else {
      options[field] = FILTER_MAPPER[operator](value)
      // }
    }

    return options
  }
  private parseOrderFilter<T extends BaseModel>(key: string, value: any): FindOptionsOrder<T> {
    const order: FindOptionsOrder<T> = {}
    const split = key.split('__')
    if (split.length != 2) {
      throw new BadRequestException('order 는 split 했을 때 길이가 2 이어야 합니다.')
    }
    const [_, field] = split
    order[field] = value

    return order
  }
}
