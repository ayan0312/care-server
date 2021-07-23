import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm'

import { CharacterEntity } from 'src/character/character.entity'
import { AssetEntity } from 'src/asset/asset.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { Length } from 'class-validator'

@Entity('character_asset_set')
export class CharacterAssetSetEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @ManyToOne((type) => CharacterEntity, (character) => character.assetSets)
    public character: CharacterEntity

    @ManyToMany((type) => AssetEntity, (asset) => asset.assetSets)
    @JoinTable()
    public assets: AssetEntity[]
}
