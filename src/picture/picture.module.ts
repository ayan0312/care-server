import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PictureEntity } from './picture.entity'
import { PictureService } from './picture.service'
import { PictureController } from './picture.controller'
import { TagModule } from './tag/tag.module'
import { GroupModule } from './group/group.module'
import { CategoryModule } from './category/category.module'
import { CharacterModule } from 'src/character/character.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([PictureEntity]),
        CharacterModule,
        CategoryModule,
        GroupModule,
        TagModule,
    ],
    providers: [PictureService],
    controllers: [PictureController],
    exports: [PictureService],
})
export class PictureModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
