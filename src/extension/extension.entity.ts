import { Length } from 'class-validator'
import { NameEntity } from 'src/shared/name/name.entity'
import { Column, Entity, OneToMany } from 'typeorm'
import { AssetEntity } from 'src/asset/asset.entity'

@Entity('extension')
export class ExtensionEntity extends NameEntity {
    @Column()
    @Length(0, 100)
    public uuid: string

    @Column({ default: '' })
    @Length(0, 1000)
    public href: string

    @Column({ default: '' })
    @Length(0, 100)
    public guide: string

    @Column({ default: '' })
    @Length(0, 200)
    public email: string

    @Column({ default: '' })
    @Length(0, 100)
    public author: string

    @Column({ default: '' })
    @Length(0, 100)
    public version: string

    @Column({ default: '' })
    @Length(0, 1000)
    public description: string

    @OneToMany((type) => AssetEntity, (asset) => asset.extension)
    public assets: AssetEntity[]
}
