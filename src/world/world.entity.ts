import { Column, Entity } from 'typeorm'
import { NameEntity } from 'src/shared/name/name.entity'

@Entity('world')
export class WorldEntity extends NameEntity {
    @Column()
    public content: string = ''
}
