import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssetEntity } from './asset.entity'
import { AssetService } from './asset.service'
import { AssetController } from './asset.controller'
import { GroupModule } from './group/group.module'
import { CharacterModule } from 'src/character/character.module'
import { TagModule } from 'src/tag/tag.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([AssetEntity]),
        TagModule,
        GroupModule,
        CharacterModule,
    ],
    providers: [AssetService],
    controllers: [AssetController],
    exports: [AssetService],
})
export class AssetModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
