import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StoryChapterController } from './storyChapter.controller'
import { StoryChapterEntity } from './storyChapter.entity'
import { StoryChapterService } from './storyChapter.service'

@Module({
    imports: [TypeOrmModule.forFeature([StoryChapterEntity])],
    providers: [StoryChapterService],
    controllers: [StoryChapterController],
    exports: [StoryChapterService],
})
export class StoryChapterModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
