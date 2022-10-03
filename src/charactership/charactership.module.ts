import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharactershipEntity } from './charactership.entity'
import { CharactershipService } from './charactership.service'
import { CharactershipController } from './charactership.controller'
import { RelationshipModule } from 'src/relationship/relationship.module'
import { CharacterModule } from 'src/character/character.module'
@Module({
    imports: [
        TypeOrmModule.forFeature([CharactershipEntity]),
        CharacterModule,
        RelationshipModule,
    ],
    providers: [CharactershipService],
    controllers: [CharactershipController],
    exports: [CharactershipService],
})
export class CharactershipModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
