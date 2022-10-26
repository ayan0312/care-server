import { Column, Entity } from 'typeorm'
import { NameEntity } from 'src/shared/name/name.entity'

@Entity('story')
export class StoryEntity extends NameEntity {
    @Column()
    public chapter: number

    @Column()
    public content: string = ''

    @Column()
    public characterIds: string // don't set directly, characters is got in content.

    @Column()
    public assetIds: string // be the same as characterIds

    @Column()
    public worldId: number
}
