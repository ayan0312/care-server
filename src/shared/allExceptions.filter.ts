import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'

import { ErrorCodes, getErrorMessage } from './errorCodes'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        let errorCode = ErrorCodes.UNKNOWN_ERROR
        let message: string | null = null
        let errors = []

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus()
            const res: any = exception.getResponse()
            if (typeof res === 'string') message = res
            else if (res) {
                if (Array.isArray(res.errors) && res.errors.length > 0) {
                    message = 'Input data validation failed'
                    errors = res.errors
                }
                if (typeof res.message === 'string') message = res.message
            }
        }

        response.status(statusCode).json({
            errors,
            code: errorCode,
            result: null,
            success: false,
            message: message ? message : getErrorMessage(errorCode),
            timestamp: Date.now(),
        })
    }
}
