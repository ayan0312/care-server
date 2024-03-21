import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AssetModule } from 'src/asset/asset.module'
import { TempController } from './temp.controller'
import { CharacterModule } from 'src/character/character.module'
import { CategoryModule } from 'src/category/category.module'

@Module({
    imports: [AssetModule, CharacterModule, CategoryModule],
    controllers: [TempController],
})
export class TempModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
