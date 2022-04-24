import { Entity } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'

@Entity('asset_group')
export class AssetGroupEntity extends StarNameEntity {}
