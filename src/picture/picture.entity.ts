import { Column, Entity, JoinTable, ManyToMany } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { PictureGroupEntity } from './group/group.entity'
import { Length } from 'class-validator'
import { CharacterEntity } from 'src/character/character.entity'
import { CharacterPictureSetEntity } from 'src/character/pictureSet/pictureSet.entity'

@Entity('picture')
export class PictureEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @Column({ default: '' })
    @Length(0, 255)
    public remark: string = ''

    @Column({ type: 'varchar', default: '' })
    public tagIds: string = ''

    @Column({ default: '' })
    @Length(0, 100)
    public picture: string = ''

    @ManyToMany((type) => PictureGroupEntity, (group) => group.pictures)
    public groups: PictureGroupEntity[]

    @ManyToMany((type) => CharacterEntity, (character) => character.pictures)
    @JoinTable()
    public characters: CharacterEntity[]

    @ManyToMany((type) => CharacterPictureSetEntity, (pictureSet) => pictureSet.pictures)
    public pictureSets: CharacterPictureSetEntity[]
}
