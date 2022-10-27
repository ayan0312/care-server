import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChapterController } from './chapter.controller'
import { ChapterEntity } from './chapter.entity'
import { ChapterService } from './chapter.service'

@Module({
    imports: [TypeOrmModule.forFeature([ChapterEntity])],
    providers: [ChapterService],
    controllers: [ChapterController],
    exports: [ChapterService],
})
export class ChapterModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
