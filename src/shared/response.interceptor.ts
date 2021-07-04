import {
    Injectable,
    NestInterceptor,
    CallHandler,
    ExecutionContext,
} from '@nestjs/common'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs'

interface Response<T> {
    result: T | {
        rows: T,
        count: number
    }
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>
    ): Observable<Response<T>> {
        return next.handle().pipe(
            map((result) => {
                return {
                    code: 0,
                    result: Array.isArray(result) ? {
                        rows: result,
                        count: result.length
                    } : result,
                    success: true,
                    message: 'request success',
                }
            })
        )
    }
}
