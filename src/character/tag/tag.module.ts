import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CharacterTagEntity } from './tag.entity'
import { TagService } from './tag.service'
import { TagController } from './tag.controller'
import { CategoryModule } from '../category/category.module'

@Module({
    imports: [TypeOrmModule.forFeature([CharacterTagEntity]), CategoryModule],
    providers: [TagService],
    controllers: [TagController],
    exports: [TagService],
})
export class TagModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
