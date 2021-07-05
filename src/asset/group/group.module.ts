import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssetGroupController } from './group.controller'
import { AssetGroupEntity } from './group.entity'
import { AssetGroupService } from './group.service'

@Module({
    imports: [TypeOrmModule.forFeature([AssetGroupEntity])],
    providers: [AssetGroupService],
    controllers: [AssetGroupController],
    exports: [AssetGroupService],
})
export class AssetGroupModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
