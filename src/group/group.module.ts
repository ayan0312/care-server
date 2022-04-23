import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharacterGroupController } from './group.controller'
import { CharacterGroupEntity } from './group.entity'
import { CharacterGroupService } from './group.service'

@Module({
    imports: [TypeOrmModule.forFeature([CharacterGroupEntity])],
    providers: [CharacterGroupService],
    controllers: [CharacterGroupController],
    exports: [CharacterGroupService],
})
export class CharacterGroupModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
