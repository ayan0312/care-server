import { Column, Entity } from 'typeorm'
import { StarNameEntity } from 'src/shared/name/starName.entity'

@Entity('world')
export class WorldEntity extends StarNameEntity {
    @Column()
    public content: string = ''

    @Column()
    public assetIds: string = '' // setting assets directly, it maybe unused

    @Column()
    public characterIds: string = '' // being the same as the assetIds
}
