import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharacterGroupController } from './characterGroup.controller'
import { CharacterGroupEntity } from './characterGroup.entity'
import { CharacterGroupService } from './characterGroup.service'

@Module({
    imports: [TypeOrmModule.forFeature([CharacterGroupEntity])],
    providers: [CharacterGroupService],
    controllers: [CharacterGroupController],
    exports: [CharacterGroupService],
})
export class CharacterGroupModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
