import { HttpException, HttpStatus } from '@nestjs/common'
import { ErrorCodes } from './errorCodes'

export class ErrorCodeException extends HttpException {
    constructor(res: { code: ErrorCodes; message?: string }) {
        super(res, HttpStatus.OK)
    }
}
