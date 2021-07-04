import { Column, Entity, JoinTable, ManyToMany } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { AssetGroupEntity } from './group/group.entity'
import { Length } from 'class-validator'
import { CharacterEntity } from 'src/character/character.entity'
import { CharacterAssetSetEntity } from 'src/character/assetSet/assetSet.entity'

export const enum DataType {
    file = 1,
    folder
}

@Entity('asset')
export class AssetEntity extends StarNameEntity {
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
    public asset: string = ''

    @ManyToMany((type) => AssetGroupEntity, (group) => group.assets)
    public groups: AssetGroupEntity[]

    @ManyToMany((type) => CharacterEntity, (character) => character.assets)
    @JoinTable()
    public characters: CharacterEntity[]

    @ManyToMany(
        (type) => CharacterAssetSetEntity,
        (assetSet) => assetSet.assets
    )
    public assetSets: CharacterAssetSetEntity[]
}
