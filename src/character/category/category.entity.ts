import { Entity, OneToMany } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { CharacterTagEntity } from 'src/character/tag/tag.entity'

@Entity('character_category')
export class CharacterCategoryEntity extends NameEntity {
    @OneToMany((type) => CharacterTagEntity, (tag) => tag.category)
    public tags: CharacterTagEntity[]
}
