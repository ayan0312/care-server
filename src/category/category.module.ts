import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CategoryService } from './category.service'
import { CategoryController } from './category.controller'
import { CategoryEntity } from './category.entity'

@Module({
    imports: [TypeOrmModule.forFeature([CategoryEntity])],
    providers: [CategoryService],
    controllers: [CategoryController],
    exports: [CategoryService],
})
export class CategoryModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
