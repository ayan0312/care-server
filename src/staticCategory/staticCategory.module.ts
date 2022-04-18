import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StaticCategoryService } from './staticCategory.service'
import { StaticCategoryController } from './staticCategory.controller'
import { StaticCategoryEntity } from './staticCategory.entity'

@Module({
    imports: [TypeOrmModule.forFeature([StaticCategoryEntity])],
    providers: [StaticCategoryService],
    controllers: [StaticCategoryController],
    exports: [StaticCategoryService],
})
export class StaticCategoryModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
