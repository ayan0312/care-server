import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AssetModule } from 'src/asset/asset.module'
import { TempController } from './temp.controller'

@Module({
    imports: [AssetModule],
    controllers: [TempController],
})
export class TempModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
