import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PictureEntity } from './picture.entity'
import { PictureService } from './picture.service'
import { PictureController } from './picture.controller'
import { GroupModule } from './group/group.module'
import { CharacterModule } from 'src/character/character.module'
import { TagModule } from 'src/tag/tag.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([PictureEntity]),
        TagModule,
        GroupModule,
        CharacterModule,
    ],
    providers: [PictureService],
    controllers: [PictureController],
    exports: [PictureService],
})
export class PictureModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
