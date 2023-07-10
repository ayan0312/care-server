import { Column, Entity } from 'typeorm'

import { StarNameEntity } from 'src/shared/name/starName.entity'
import { Length } from 'class-validator'
import { AssetType } from 'src/interface/asset.interface'

@Entity('asset')
export class AssetEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @Column({ default: false })
    public recycle: boolean = false

    @Column({ default: false })
    public template: boolean = false

    @Column({ default: '' })
    public path: string = ''

    @Column('simple-enum')
    public assetType: AssetType = AssetType.files

    @Column({ default: '' })
    public tagIds: string = ''

    @Column({ default: '' })
    public characterIds: string = ''

    @Column({ default: '' })
    public extensionIds: string = ''
}
