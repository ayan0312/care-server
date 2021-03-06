import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharacterModule } from '../character/character.module'
import { AssetSetController } from './assetSet.controller'
import { CharacterAssetSetEntity } from './assetSet.entity'
import { AssetSetService } from './assetSet.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([CharacterAssetSetEntity]),
        CharacterModule,
    ],
    providers: [AssetSetService],
    controllers: [AssetSetController],
    exports: [AssetSetService],
})
export class AssetSetModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
