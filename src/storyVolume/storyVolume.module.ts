import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StoryChapterModule } from 'src/storyChapter/storyChapter.module'
import { StoryVolumeController } from './storyVolume.controller'
import { StoryVolumeEntity } from './storyVolume.entity'
import { StoryVolumeService } from './storyVolume.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([StoryVolumeEntity]),
        StoryChapterModule,
    ],
    providers: [StoryVolumeService],
    controllers: [StoryVolumeController],
    exports: [StoryVolumeService],
})
export class StoryVolumeModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
