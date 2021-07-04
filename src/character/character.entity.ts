import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm'
import { Length } from 'class-validator'

import { AssetEntity } from 'src/asset/asset.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { CharacterGroupEntity } from './group/group.entity'
import { CharacterAssetSetEntity } from './assetSet/assetSet.entity'

@Entity('character')
export class CharacterEntity extends StarNameEntity {
    @Column({ type: 'varchar', default: '' })
    public tagIds: string = ''

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

    @ManyToMany((type) => CharacterGroupEntity, (group) => group.characters)
    @JoinTable()
    public groups: CharacterGroupEntity[]

    @ManyToMany((type) => AssetEntity, (asset) => asset.characters)
    public assets: AssetEntity[]

    @OneToMany(
        (type) => CharacterAssetSetEntity,
        (assetSet) =>assetSet.character
    )
    public assetSets: CharacterAssetSetEntity[]
}
