import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { Length } from 'class-validator'
import { CharacterAssetSetEntity } from 'src/assetSet/assetSet.entity'
import { AssetType } from 'src/interface/asset/asset.interface'
import { ExtensionEntity } from 'src/extension/extension.entity'

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

    @Column({ default: false })
    public recycle: boolean = false

    @Column('simple-enum')
    public assetType: AssetType = AssetType.file

    @Column({ default: '' })
    public tagIds: string = ''

    @Column({ default: '' })
    public groupIds: string = ''

    @Column({ default: '' })
    public characterIds: string = ''

    @ManyToOne((type) => ExtensionEntity, (extension) => extension.assets)
    public extension: ExtensionEntity

    @ManyToMany(
        (type) => CharacterAssetSetEntity,
        (assetSet) => assetSet.assets
    )
    public assetSets: CharacterAssetSetEntity[]
}
