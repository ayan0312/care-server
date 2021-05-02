import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CategoryTemplateEntity } from './template.entity'
import { CategoryTemplateService } from './template.service'
import { CategoryTemplateController } from './template.controller'

@Module({
    imports: [TypeOrmModule.forFeature([CategoryTemplateEntity])],
    providers: [CategoryTemplateService],
    controllers: [CategoryTemplateController],
})
export class CategoryTemplateModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
