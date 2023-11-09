import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WikiController } from './wiki.controller'
import { WikiEntity } from './wiki.entity'
import { WikiService } from './wiki.service'

@Module({
    imports: [TypeOrmModule.forFeature([WikiEntity])],
    providers: [WikiService],
    controllers: [WikiController],
    exports: [WikiService],
})
export class WikiModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
