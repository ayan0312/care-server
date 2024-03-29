import { IsInt, Max, Min } from 'class-validator'
import { Column, Entity } from 'typeorm'

import { NameEntity } from './name.entity'

@Entity()
export abstract class StarNameEntity extends NameEntity {
    @Column('boolean', { default: false })
    public star: boolean = false

    @Column({ default: 0 })
    @IsInt()
    @Min(0)
    @Max(5)
    public rating: number = 0
}
