import { Entity, JoinTable, ManyToMany } from 'typeorm'

import { AssetEntity } from 'src/asset/asset.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'

@Entity('asset_group')
export class AssetGroupEntity extends StarNameEntity {
    @ManyToMany((type) => AssetEntity, (asset) => asset.groups)
    @JoinTable()
    public assets: AssetEntity[]
}
