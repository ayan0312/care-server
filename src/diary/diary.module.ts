import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DiaryController } from './diary.controller'
import { DiaryEntity } from './diary.entity'
import { DiaryService } from './diary.service'
import { CharacterModule } from 'src/character/character.module'

@Module({
    imports: [TypeOrmModule.forFeature([DiaryEntity]), CharacterModule],
    providers: [DiaryService],
    controllers: [DiaryController],
    exports: [DiaryService],
})
export class DiaryModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
