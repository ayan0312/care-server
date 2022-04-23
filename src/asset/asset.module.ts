import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssetEntity } from './asset.entity'
import { AssetService } from './asset.service'
import { AssetController } from './asset.controller'
import { AssetGroupModule } from './group/group.module'
import { CharacterModule } from 'src/character/character.module'
import { TagModule } from 'src/tag/tag.module'
import { AssetSetModule } from 'src/assetSet/assetSet.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([AssetEntity]),
        TagModule,
        AssetSetModule,
        CharacterModule,
        AssetGroupModule,
    ],
    providers: [AssetService],
    controllers: [AssetController],
    exports: [AssetService],
})
export class AssetModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
