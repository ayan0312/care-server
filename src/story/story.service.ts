import { Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    mergeObjectToEntity,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { StoryEntity } from './story.entity'
import {
    IStory,
    IStorySearch,
    IStorySearchCondition,
} from 'src/interface/story.interface'

@Injectable()
export class StoryService {
    constructor(
        @InjectRepository(StoryEntity)
        private readonly storyRepo: Repository<StoryEntity>
    ) {}

    public async findAll() {
        return await this.storyRepo.find()
    }

    public async findById(id: number) {
        const result = await this.storyRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.storyRepo.findByIds(ids)
    }

    public async search(body: IStorySearch) {
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

    private _createConditionQB(condition: IStorySearchCondition) {
        let qb = this.storyRepo.createQueryBuilder('world')

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
        if (condition.worldId != null)
            qb = qb.andWhere('world.worldId = :worldId', {
                worldId: condition.worldId,
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

    private async _mergeObjectToEntity(world: StoryEntity, body: IStory) {
        mergeObjectToEntity(world, body)
        await throwValidatedErrors(world)
    }

    public async create(body: IStory) {
        const story = new StoryEntity()
        await this._mergeObjectToEntity(story, body)
        return this.storyRepo.save(story)
    }

    public async update(id: number, body: IStory) {
        const story = await this.findById(id)
        await this._mergeObjectToEntity(story, body)
        return await this.storyRepo.save(story)
    }

    public async delete(id: number) {
        await this.findById(id)
        return await this.storyRepo.delete(id)
    }

    public async hasName(name: string) {
        const world = await this.storyRepo.findOne({ name })
        return !!world
    }
}
