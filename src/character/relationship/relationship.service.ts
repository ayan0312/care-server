import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RelationshipEntity } from './relationship.entity'

@Injectable()
export class RelationshipService {
    constructor(
        @InjectRepository(RelationshipEntity)
        private readonly relationRepo: Repository<RelationshipEntity>
    ) {}

    public async findAll() {}
}
