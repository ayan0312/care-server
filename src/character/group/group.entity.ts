import { Entity, JoinTable, ManyToMany } from 'typeorm'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { CharacterEntity } from 'src/character/character.entity'

@Entity('character_group')
export class CharacterGroupEntity extends StarNameEntity {
    @ManyToMany((type) => CharacterEntity, (character) => character.groups)
    @JoinTable()
    public characters: CharacterEntity[]
}
