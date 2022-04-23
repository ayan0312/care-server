import {
    Injectable,
    NestInterceptor,
    CallHandler,
    ExecutionContext,
} from '@nestjs/common'
import { map } from 'rxjs/operators'

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        return next.handle().pipe(
            map((result) => {
                if (result.HTML) return result.HTML

                return {
                    code: 0,
                    result: Array.isArray(result)
                        ? {
                              rows: result,
                              total: result.length,
                          }
                        : result,
                    success: true,
                    message: 'request success',
                }
            })
        )
    }
}
