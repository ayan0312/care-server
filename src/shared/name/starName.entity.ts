import { IsInt, Max, Min } from 'class-validator'
import { Column, Entity } from 'typeorm'

import { NameEntity } from './name.entity'

@Entity()
export abstract class StarNameEntity extends NameEntity {
    @Column('boolean', { default: false })
    public star: boolean

    @Column()
    @IsInt()
    @Min(0)
    @Max(10)
    public rating: number = 0
}
