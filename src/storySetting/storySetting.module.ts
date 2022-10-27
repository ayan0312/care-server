import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StorySettingController } from './storySetting.controller'
import { StorySettingEntity } from './storySetting.entity'
import { StorySettingService } from './storySetting.service'

@Module({
    imports: [TypeOrmModule.forFeature([StorySettingEntity])],
    providers: [StorySettingService],
    controllers: [StorySettingController],
    exports: [StorySettingService],
})
export class StorySettingModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
