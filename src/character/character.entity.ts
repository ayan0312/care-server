import { Column, Entity, OneToMany } from 'typeorm'
import { Length } from 'class-validator'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { ICharacterStaticCategory } from 'src/interface/character.interface'

@Entity('character')
export class CharacterEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1024)
    public wiki: string = ''

    @Column({ default: '' })
    @Length(0, 1024)
    public intro: string = ''

    @Column({ default: '' })
    @Length(0, 100)
    public avatar: string = ''

    @Column({ default: false })
    public recycle: boolean = false

    @Column({ default: false })
    public template: boolean = false

    @Column('simple-json')
    public staticCategories: ICharacterStaticCategory = {}

    @Column({ default: '' })
    @Length(0, 100)
    public fullLengthPicture: string = ''

    @Column({ default: '' })
    public tagIds: string = ''
}

@Entity('character_relationship')
export class CharacterRelationshipEntity {}
