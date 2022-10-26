import { Repository } from 'typeorm'
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    mergeObjectToEntity,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { WorldEntity } from './world.entity'
import {
    IWorld,
    IWorldSearch,
    IWorldSearchCondition,
} from 'src/interface/world.interface'

@Injectable()
export class WorldService {
    constructor(
        @InjectRepository(WorldEntity)
        private readonly worldRepo: Repository<WorldEntity>
    ) {}

    public async findAll() {
        return await this.worldRepo.find()
    }

    public async findById(id: number) {
        const result = await this.worldRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.worldRepo.findByIds(ids)
    }

    public async search(body: IWorldSearch) {
        const {
            condition = {},
            orderBy = { sort: 'created', order: 'DESC' },
            size = 20,
            page = 1,
        } = body

        let qb = this._createConditionQB(condition)
        if (orderBy != null)
            qb = qb.orderBy(`character.${orderBy.sort}`, orderBy.order)

        const data = await qb
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        const rows = data[0]

        return {
            page: Number(page),
            size: Number(size),
            rows,
            total: data[1],
        }
    }

    private _createConditionQB(condition: IWorldSearchCondition) {
        let qb = this.worldRepo.createQueryBuilder('world')

        if (condition.name != null)
            qb = qb.where('world.name like :name', {
                name: `%${condition.name}%`,
            })
        if (condition.content != null)
            qb = qb.andWhere('world.content like :content', {
                content: `%${condition.content}%`,
            })
        if (condition.star != null)
            qb = qb.andWhere('world.star = :star', {
                star: !!condition.star,
            })

        if (condition.rating != null)
            qb = qb.andWhere('world.rating = :rating', {
                rating: condition.rating,
            })
        if (condition.assetIds)
            qb = queryQBIds(qb, condition.assetIds, 'world.assetIds')
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'world.characterIds')

        return qb
    }

    private async _mergeObjectToEntity(world: WorldEntity, body: IWorld) {
        mergeObjectToEntity(world, body)
        await throwValidatedErrors(world)
    }

    public async create(body: IWorld) {
        const world = new WorldEntity()
        await this._mergeObjectToEntity(world, body)

        if (await this.hasName(world.name))
            throw new ConflictException('has the same name')

        return this.worldRepo.save(world)
    }

    public async update(id: number, body: IWorld) {
        const world = await this.findById(id)

        if (
            body.name &&
            world.name !== body.name &&
            (await this.hasName(body.name))
        )
            throw new ConflictException('has the same name')

        await this._mergeObjectToEntity(world, body)
        return await this.worldRepo.save(world)
    }

    public async delete(id: number) {
        await this.findById(id)
        return await this.worldRepo.delete(id)
    }

    public async hasName(name: string) {
        const world = await this.worldRepo.findOne({ name })
        return !!world
    }
}
