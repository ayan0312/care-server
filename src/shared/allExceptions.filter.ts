import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'

import { ErrorCodeException, ErrorCodes, getErrorMessage } from './errorCodes'
import { isPlainObject } from './utilities'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        let errorCode = ErrorCodes.UNKNOWN
        let message: string | null = null
        let errors = []

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus()
            const res: any = exception.getResponse()

            if (typeof res === 'string') message = res
            else if (typeof res === 'number') message = String(res)
            else if (isPlainObject(res) as any) {
                if (Array.isArray(res.errors) && res.errors.length > 0) {
                    message = 'Input data validation failed'
                    errors = res.errors.map((err: any) => {
                        return err.constraints
                    })
                }
                if (typeof res.message === 'string') message = res.message
            }

            if (exception instanceof ErrorCodeException) errorCode = res.code
        } else if (exception instanceof Error) {
            if (exception.message) message = exception.message
            console.error(exception)
        } else if (typeof exception === 'string') {
            message = exception
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
