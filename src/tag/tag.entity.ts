import { Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { CategoryEntity } from 'src/category/category.entity'
import { AssetEntity } from 'src/asset/asset.entity'
import { CharacterEntity } from 'src/character/character.entity'

@Entity('tag')
export class TagEntity extends NameEntity {
    @ManyToOne((type) => CategoryEntity, (category) => category.tags)
    public category: CategoryEntity

    @ManyToMany((type) => AssetEntity, (asset) => asset.tags)
    @JoinTable()
    public assets: AssetEntity[]

    @ManyToMany((type) => CharacterEntity, (character) => character.tags)
    @JoinTable()
    public characters: CharacterEntity[]
}
