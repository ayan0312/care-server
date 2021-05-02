export const enum ErrorCodes {
    UNKNOWN_ERROR = 1,
}

const errorCodeMessages: Record<ErrorCodes, string> = {
    [ErrorCodes.UNKNOWN_ERROR]: 'unknown error',
}

export function getErrorMessage(code: ErrorCodes = ErrorCodes.UNKNOWN_ERROR) {
    return errorCodeMessages[code]
}
