import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssetGroupController } from './assetGroup.controller'
import { AssetGroupEntity } from './assetGroup.entity'
import { AssetGroupService } from './assetGroup.service'

@Module({
    imports: [TypeOrmModule.forFeature([AssetGroupEntity])],
    providers: [AssetGroupService],
    controllers: [AssetGroupController],
    exports: [AssetGroupService],
})
export class AssetGroupModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
