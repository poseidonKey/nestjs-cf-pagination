import { Column, Entity, OneToMany } from 'typeorm'
import { RolesEnum } from '../const/roles.const'
import { PostModel } from 'src/posts/entities/posts.entity'
import { BaseModel } from 'src/common/entity/base.entity'
import { IsEmail, IsString, Length } from 'class-validator'
import { lenghValidationMessage } from 'src/common/validation-message/length-validation.message'
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message'
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message'
import { Exclude } from 'class-transformer'

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    length: 20,
    unique: true
  })
  @IsString({
    message: stringValidationMessage
  })
  @Length(1, 20, {
    message: lenghValidationMessage
  })
  nickname: string
  @Column({
    unique: true
  })
  @IsString({
    message: stringValidationMessage
  })
  @IsEmail(
    {},
    {
      message: emailValidationMessage
    }
  )
  email: string
  @Column()
  @IsString({
    message: stringValidationMessage
  })
  @Length(3, 8, {
    message: lenghValidationMessage
  })
  @Exclude({
    toPlainOnly: true
  })
  password: string
  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER
  })
  role: RolesEnum
  @OneToMany(() => PostModel, post => post.author)
  posts: PostModel[]
}
