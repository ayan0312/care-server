import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TempController } from './temp.controller'

@Module({
    controllers: [TempController],
})
export class TempModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
