import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm'
import { Length } from 'class-validator'

import { PictureEntity } from 'src/picture/picture.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { CharacterGroupEntity } from './group/group.entity'
import { CharacterTagEntity } from './tag/tag.entity'

@Entity('character')
export class CharacterEntity extends StarNameEntity {
    @ManyToMany((type) => CharacterTagEntity, (tag) => tag.characters)
    @JoinTable()
    public tags: CharacterTagEntity[]

    @ManyToMany((type) => CharacterGroupEntity, (group) => group.characters)
    @JoinTable()
    public groups: CharacterGroupEntity[]

    @ManyToMany((type) => PictureEntity, (picture) => picture.characters)
    public pictures: PictureEntity[]

    @Column({ default: '' })
    @Length(0, 25)
    public wiki: string = ''

    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @Column({ default: '' })
    @Length(0, 100)
    public avatar: string = ''

    @Column({ default: '' })
    @Length(0, 255)
    public remark: string = ''

    @Column('simple-array')
    public staticCategories: string[] = []

    @Column({ default: '' })
    @Length(0, 100)
    public fullLengthPicture: string = ''
}
