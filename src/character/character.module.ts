import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharacterEntity } from './character.entity'
import { CharacterService } from './character.service'
import { CharacterController } from './character.controller'
import { TagModule } from 'src/tag/tag.module'
import { CharacterGroupModule } from './group/group.module'
import { AssetSetModule } from './assetSet/assetSet.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([CharacterEntity]),
        TagModule,
        AssetSetModule,
        CharacterGroupModule,
    ],
    providers: [CharacterService],
    controllers: [CharacterController],
    exports: [CharacterService],
})
export class CharacterModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
