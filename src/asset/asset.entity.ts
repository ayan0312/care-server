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

    @Column({ default: '' })
    @Length(0, 255)
    public remark: string = ''

    @Column({ default: false })
    public recycle: boolean = false

    // deprecated
    @Column('simple-array')
    public filenames: string[] = []

    @Column({ default: '' })
    public path: string = ''

    @Column('simple-enum')
    public assetType: AssetType = AssetType.files

    @Column({ default: '' })
    public tagIds: string = ''

    @Column({ default: '' })
    public groupIds: string = ''

    @Column({ default: '' })
    public characterIds: string = ''

    @Column({ default: '' })
    public extensionIds: string = ''

    @ManyToMany(
        (type) => CharacterAssetSetEntity,
        (assetSet) => assetSet.assets
    )
    public assetSets: CharacterAssetSetEntity[]
}
