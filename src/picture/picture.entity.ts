import { Column, Entity, JoinTable, ManyToMany } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { PictureGroupEntity } from './group/group.entity'
import { Length } from 'class-validator'
import { PictureTagEntity } from './tag/tag.entity'
import { CharacterEntity } from 'src/character/character.entity'

@Entity('picture')
export class PictureEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string

    @Column({ default: '' })
    @Length(0, 255)
    public remark: string

    @ManyToMany((type) => PictureTagEntity, (tag) => tag.pictures)
    @JoinTable()
    public tags: PictureTagEntity[]

    @ManyToMany((type) => PictureGroupEntity, (group) => group.pictures)
    public groups: PictureGroupEntity[]

    @ManyToMany((type) => CharacterEntity, (character) => character.pictures)
    @JoinTable()
    public characters: CharacterEntity[]

    @Column()
    public picture: string
}
