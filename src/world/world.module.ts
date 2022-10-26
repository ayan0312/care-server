import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorldController } from './world.controller'
import { WorldEntity } from './world.entity'
import { WorldService } from './world.service'

@Module({
    imports: [TypeOrmModule.forFeature([WorldEntity])],
    providers: [WorldService],
    controllers: [WorldController],
    exports: [WorldService],
})
export class WorldModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
