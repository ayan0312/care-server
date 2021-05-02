import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { CharacterEntity } from 'src/character/character.entity'
import { PictureGroupEntity } from './group/group.entity'
import { Length } from 'class-validator'

@Entity('picture')
export class PictureEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string

    @Column({ default: '' })
    @Length(0, 255)
    public remark: string

    @Column('simple-array')
    public tagIds: number[]

    @ManyToMany((type) => PictureGroupEntity, (group) => group.pictures)
    public groups: PictureGroupEntity[]

    @ManyToOne((type) => CharacterEntity, (character) => character.pictures)
    public character: CharacterEntity

    @Column()
    public picture: string
}
