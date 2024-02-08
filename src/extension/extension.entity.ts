import { Column, Entity } from 'typeorm'
import { NameEntity } from 'src/shared/name/name.entity'

@Entity('extension')
export class ExtensionEntity extends NameEntity {
    @Column()
    public uuid: string

    @Column()
    public author: string

    @Column()
    public version: number

    @Column()
    public description: string
}
