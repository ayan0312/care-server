import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CategoryService } from './category.service'
import { CategoryController } from './category.controller'
import { CharacterCategoryEntity } from './category.entity'

@Module({
    imports: [TypeOrmModule.forFeature([CharacterCategoryEntity])],
    providers: [CategoryService],
    controllers: [CategoryController],
    exports: [CategoryService],
})
export class CategoryModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
