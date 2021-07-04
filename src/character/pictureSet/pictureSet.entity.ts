import { Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm'

import { CharacterEntity } from 'src/character/character.entity'
import { PictureEntity } from 'src/picture/picture.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'

@Entity('character_picture_set')
export class CharacterPictureSetEntity extends StarNameEntity {
    @ManyToOne((type) => CharacterEntity, (character) => character.pictureSets)
    public character: CharacterEntity

    @ManyToMany((type) => PictureEntity, (picture) => picture.pictureSets)
    @JoinTable()
    public pictures: CharacterEntity[]
}
