import { Column, Entity, JoinTable, ManyToMany } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { AssetGroupEntity } from './group/group.entity'
import { Length } from 'class-validator'
import { CharacterEntity } from 'src/character/character.entity'
import { CharacterAssetSetEntity } from 'src/character/assetSet/assetSet.entity'
import { TagEntity } from 'src/tag/tag.entity'

export const enum AssetType {
    file = 1,
    folder,
}

@Entity('asset')
export class AssetEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @Column({ default: '' })
    @Length(0, 255)
    public remark: string = ''

    @Column({ default: '' })
    @Length(0, 100)
    public path: string = ''

    @Column('simple-enum')
    public assetType: AssetType = AssetType.file

    @ManyToMany((type) => TagEntity, (tag) => tag.characters)
    public tags: TagEntity[]

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
