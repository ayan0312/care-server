import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharacterEntity } from './character.entity'
import { CharacterService } from './character.service'
import { CharacterController } from './character.controller'
import { TagModule } from 'src/tag/tag.module'
import { StaticCategoryModule } from 'src/staticCategory/staticCategory.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([CharacterEntity]),
        TagModule,
        StaticCategoryModule,
    ],
    providers: [CharacterService],
    controllers: [CharacterController],
    exports: [CharacterService],
})
export class CharacterModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
