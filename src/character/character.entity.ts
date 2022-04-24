import { Column, Entity, ManyToMany, OneToMany } from 'typeorm'
import { Length } from 'class-validator'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { CharacterAssetSetEntity } from '../assetSet/assetSet.entity'
import { ICharacterStaticCategory } from 'src/interface/character/character.interface'

@Entity('character')
export class CharacterEntity extends StarNameEntity {
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

    @Column({ default: false })
    public recycle: boolean = false

    @Column('simple-json')
    public staticCategories: ICharacterStaticCategory = {}

    @Column({ default: '' })
    @Length(0, 100)
    public fullLengthPicture: string = ''

    @Column({ default: '' })
    public tagIds: string = ''

    @Column({ default: '' })
    public groupIds: string = ''

    @OneToMany(
        (type) => CharacterAssetSetEntity,
        (assetSet) => assetSet.character
    )
    public assetSets: CharacterAssetSetEntity[]
}

@Entity('character_relationship')
export class CharacterRelationshipEntity {}
