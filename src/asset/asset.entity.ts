import { Column, Entity, ManyToMany } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { Length } from 'class-validator'
import { CharacterAssetSetEntity } from 'src/assetSet/assetSet.entity'
import { AssetType } from 'src/interface/asset.interface'

@Entity('asset')
export class AssetEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    // deprecated
    @Column({ default: '' })
    @Length(0, 255)
    public remark: string = ''

    @Column({ default: false })
    public recycle: boolean = false

    @Column({ default: '' })
    public path: string = ''

    @Column('simple-enum')
    public assetType: AssetType = AssetType.files

    @Column({ default: '' })
    public tagIds: string = ''

    // deprecated
    @Column({ default: '' })
    public groupIds: string = ''

    @Column({ default: '' })
    public characterIds: string = ''

    @Column({ default: '' })
    public extensionIds: string = ''

    // deprecated
    @ManyToMany(
        (type) => CharacterAssetSetEntity,
        (assetSet) => assetSet.assets
    )
    public assetSets: CharacterAssetSetEntity[]
}
