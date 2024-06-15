import * as common from '@nestjs/common'

@common.Injectable()
export class PasswordPipe implements common.PipeTransform {
  transform(value: any) {
    if (value.toString().length > 8) {
      throw new common.BadRequestException('비밀번호는 8자 이하로 입력해 주세요')
    }
    return value.toString()
  }
}
@common.Injectable()
export class MaxLengthPipe implements common.PipeTransform {
  constructor(private readonly length: number) {}
  transform(value: any) {
    if (value.toString().length > this.length) {
      throw new common.BadRequestException(`최대 길이는 ${this.length}`)
    }
    return value.toString()
  }
}

@common.Injectable()
export class MinLengthPipe implements common.PipeTransform {
  constructor(private readonly length: number) {}
  transform(value: any) {
    if (value.toString().length < this.length) {
      throw new common.BadRequestException(`최소 길이는 ${this.length}`)
    }
    return value.toString()
  }
}
