import { HttpException, HttpStatus } from '@nestjs/common'

export const enum ErrorCodes {
    UNKNOWN = 1,
    SAME_NAME,
    TIME_OUT,
}

const errorCodeMessages: Record<ErrorCodes, string> = {
    [ErrorCodes.UNKNOWN]: 'unknown error',
    [ErrorCodes.SAME_NAME]: 'has the same name',
    [ErrorCodes.TIME_OUT]: 'time out',
}

export function getErrorMessage(code: ErrorCodes) {
    return errorCodeMessages[code]
}

export class ErrorCodeException extends HttpException {
    constructor(res?: { code: ErrorCodes; message?: string } | string) {
        const result = {
            code: ErrorCodes.UNKNOWN,
            message: getErrorMessage(ErrorCodes.UNKNOWN),
        }
        if (res) {
            if (typeof res === 'string') {
                result.message = res
            } else {
                result.code = res.code
                result.message = res.message
                    ? res.message
                    : getErrorMessage(res.code)
            }
        }

        super(result, HttpStatus.INTERNAL_SERVER_ERROR)
    }
}
