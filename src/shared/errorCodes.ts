import { HttpException, HttpStatus } from "@nestjs/common"

export const enum ErrorCodes {
    UNKNOWN_ERROR = 1,
    SAME_NAME,
}

const errorCodeMessages: Record<ErrorCodes, string> = {
    [ErrorCodes.UNKNOWN_ERROR]: 'unknown error',
    [ErrorCodes.SAME_NAME]: 'has the same name'
}

export function getErrorMessage(code: ErrorCodes) {
    return errorCodeMessages[code]
}

export class ErrorCodeException extends HttpException {
    constructor(res?: { code: ErrorCodes, message?: string } | string) {
        super(typeof res === 'string' ? {
            code: ErrorCodes.UNKNOWN_ERROR,
            message: res
        } : Object.assign({
            code: ErrorCodes.UNKNOWN_ERROR,
        }, res), HttpStatus.INTERNAL_SERVER_ERROR)
    }
}