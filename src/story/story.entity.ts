import { Column, Entity } from 'typeorm'
import { StarNameEntity } from 'src/shared/name/starName.entity'

@Entity('story')
export class StoryEntity extends StarNameEntity {
    @Column()
    public chapter: number

    @Column()
    public worldId: number = -1

    @Column()
    public content: string = '' // don't use IO of file system, because content size will not too big.

    @Column()
    public assetIds: string = '' // setting assets directly, it maybe unused

    @Column()
    public characterIds: string = '' // setting characters from the characters of world, it maybe unused
}
