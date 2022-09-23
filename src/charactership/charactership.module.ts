import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharactershipEntity } from './charactership.entity'
import { CharactershipService } from './charactership.service'
import { CharactershipController } from './charactership.controller'
@Module({
    imports: [TypeOrmModule.forFeature([CharactershipEntity])],
    providers: [CharactershipService],
    controllers: [CharactershipController],
    exports: [CharactershipService],
})
export class CharactershipModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
