import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IRelationship } from 'src/interface/relationship.interface'
import { throwValidatedErrors } from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { RelationshipEntity } from './relationship.entity'
@Injectable()
export class RelationshipService {
    constructor(
        @InjectRepository(RelationshipEntity)
        private readonly relationshipRepo: Repository<RelationshipEntity>
    ) {}

    public async find(opts?: IRelationship) {
        return await this.relationshipRepo.find(opts ? opts : {})
    }

    public async findAll() {
        return await this.find()
    }

    public async findById(id: number) {
        const result = await this.relationshipRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.relationshipRepo.findByIds(ids)
    }

    private async _mergeBodyToEntity(
        entity: RelationshipEntity,
        body: IRelationship
    ) {
        if (body.name) {
            if (await this.hasName(body.name, entity.id))
                throw new ConflictException('has the same name')
            entity.name = body.name
        }
        if (body.selfName) entity.selfName = body.selfName
        if (body.targetName) entity.targetName = body.targetName
    }

    public async create(body: IRelationship) {
        const relationship = new RelationshipEntity()
        await this._mergeBodyToEntity(relationship, body)
        await throwValidatedErrors(relationship)
        return await this.relationshipRepo.save(relationship)
    }

    public async update(id: number, body: IRelationship) {
        const relationship = await this.findById(id)
        await this._mergeBodyToEntity(relationship, body)
        return await this.relationshipRepo.save(relationship)
    }

    public async delete(id: number) {
        return await this.relationshipRepo.delete(id)
    }

    public async hasName(name: string, id?: number) {
        const result = await this.relationshipRepo
            .createQueryBuilder('relationship')
            .where(`relationship.name = :name`, { name })
            .getOne()
        if (result) return result.id !== id
        return false
    }
}
