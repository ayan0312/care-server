import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharacterEntity } from './character.entity'
import { CharacterService } from './character.service'
import { CharacterController } from './character.controller'
import { TagModule } from 'src/tag/tag.module'
import { GroupModule } from './group/group.module'
import { PictureSetModule } from './pictureSet/pictureSet.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([CharacterEntity]),
        TagModule,
        GroupModule,
        PictureSetModule
    ],
    providers: [CharacterService],
    controllers: [CharacterController],
    exports: [CharacterService],
})
export class CharacterModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
