import { Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { CharacterCategoryEntity } from 'src/character/category/category.entity'
import { CharacterEntity } from '../character.entity'

@Entity('character_tag')
export class CharacterTagEntity extends NameEntity {
    @ManyToOne((type) => CharacterCategoryEntity, (category) => category.tags)
    public category: CharacterCategoryEntity

    @ManyToMany(type => CharacterEntity, character => character.tags)
    public characters: CharacterEntity[]
}
