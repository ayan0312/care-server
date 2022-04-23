import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RelationshipEntity } from './relationship.entity'
import { RelationshipService } from './relationship.service'
import { RelationshipController } from './relationship.controller'
@Module({
    imports: [TypeOrmModule.forFeature([RelationshipEntity])],
    providers: [RelationshipService],
    controllers: [RelationshipController],
    exports: [RelationshipService],
})
export class RelationshipModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
