import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GroupController } from './group.controller'
import { AssetGroupEntity } from './group.entity'
import { GroupService } from './group.service'

@Module({
    imports: [TypeOrmModule.forFeature([AssetGroupEntity])],
    providers: [GroupService],
    controllers: [GroupController],
    exports: [GroupService],
})
export class GroupModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
