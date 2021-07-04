import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PictureSetController } from './pictureSet.controller'
import { CharacterPictureSetEntity } from './pictureSet.entity'
import { PictureSetService } from './pictureSet.service'

@Module({
    imports: [TypeOrmModule.forFeature([CharacterPictureSetEntity])],
    providers: [PictureSetService],
    controllers: [PictureSetController],
    exports: [PictureSetService],
})
export class PictureSetModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) { }
}
