import { Column, Entity, ManyToMany, OneToMany } from 'typeorm'
import { Length } from 'class-validator'

import { AssetEntity } from 'src/asset/asset.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { CharacterGroupEntity } from './group/group.entity'
import { CharacterAssetSetEntity } from './assetSet/assetSet.entity'
import { TagEntity } from 'src/tag/tag.entity'

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

    @Column('simple-array')
    public staticCategories: string[] = []

    @Column({ default: '' })
    @Length(0, 100)
    public fullLengthPicture: string = ''

    @ManyToMany((type) => TagEntity, (tag) => tag.characters)
    public tags: TagEntity[]

    @ManyToMany((type) => CharacterGroupEntity, (group) => group.characters)
    public groups: CharacterGroupEntity[]

    @ManyToMany((type) => AssetEntity, (asset) => asset.characters)
    public assets: AssetEntity[]

    @OneToMany(
        (type) => CharacterAssetSetEntity,
        (assetSet) => assetSet.character
    )
    public assetSets: CharacterAssetSetEntity[]
}
