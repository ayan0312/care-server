import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export abstract class CommonEntity {
    @PrimaryGeneratedColumn()
    public id: number

    @Column('unsigned big int')
    public created: number

    @Column('unsigned big int')
    public updated: number

    @BeforeInsert()
    public createTimestamp() {
        this.created = Date.now()
        this.updated = Date.now()
    }

    @BeforeUpdate()
    public updateTimestamp() {
        this.updated = Date.now()
    }
}
