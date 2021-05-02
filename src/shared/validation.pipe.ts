import {
    PipeTransform,
    ArgumentMetadata,
    BadRequestException,
    HttpStatus,
    Injectable,
    Type,
} from '@nestjs/common'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { HttpException } from '@nestjs/common/exceptions/http.exception'

@Injectable()
export class ClassValidationPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata) {
        if (!value) {
            throw new BadRequestException('No data submitted')
        }

        const { metatype } = metadata
        if (!metatype || !this.toValidate(metatype)) {
            return value
        }
        const object = plainToClass(metatype, value)
        const errors = await validate(object)
        if (errors.length > 0) {
            throw new HttpException(
                {
                    message: 'Input data validation failed',
                    errors: errors
                        .map((error) => error.constraints)
                        .filter((error) => error),
                },
                HttpStatus.BAD_REQUEST
            )
        }
        return value
    }

    private toValidate(metatype: Type<any>) {
        const types = [String, Boolean, Number, Array, Object]
        return !types.find((type) => metatype === type)
    }
}
