import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StoryController } from './story.controller'
import { StoryEntity } from './story.entity'
import { StoryService } from './story.service'

@Module({
    imports: [TypeOrmModule.forFeature([StoryEntity])],
    providers: [StoryService],
    controllers: [StoryController],
    exports: [StoryService],
})
export class StoryModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
