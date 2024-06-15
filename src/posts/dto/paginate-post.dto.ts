// import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsIn } from 'class-validator'

export class PaginatePostDto {
  // @Type(() => Number)
  @IsNumber()
  @IsOptional()
  where__id_more_than?: number

  @IsNumber()
  @IsOptional()
  where__id_less_than?: number

  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order__createdAt: 'ASC' | 'DESC' = 'ASC'

  @IsNumber()
  @IsOptional()
  take: number = 20
}
