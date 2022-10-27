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
            qb = qb.orderBy(`story.${orderBy.sort}`, orderBy.order)

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
        let qb = this.storyRepo.createQueryBuilder('story')

        if (condition.name != null)
            qb = qb.where('story.name like :name', {
                name: `%${condition.name}%`,
            })
        if (condition.intro != null)
            qb = qb.andWhere('story.intro like :intro', {
                intro: `%${condition.intro}%`,
            })
        if (condition.star != null)
            qb = qb.andWhere('story.star = :star', {
                star: !!condition.star,
            })
        if (condition.rating != null)
            qb = qb.andWhere('story.rating = :rating', {
                rating: condition.rating,
            })
        if (condition.recycle != null)
            qb = qb.andWhere('story.recycle = :recycle', {
                recycle: !!condition.recycle,
            })
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'story.characterIds')

        return qb
    }

    private async _mergeObjectToEntity(world: StoryEntity, body: IStory) {
        mergeObjectToEntity(world, body)
        await throwValidatedErrors(world)
    }

    public async create(body: IStory) {
        const world = new StoryEntity()
        await this._mergeObjectToEntity(world, body)

        if (await this.hasName(world.name))
            throw new ConflictException('has the same name')

        return this.storyRepo.save(world)
    }

    public async update(id: number, body: IStory) {
        const world = await this.findById(id)

        if (
            body.name &&
            world.name !== body.name &&
            (await this.hasName(body.name))
        )
            throw new ConflictException('has the same name')

        await this._mergeObjectToEntity(world, body)
        return await this.storyRepo.save(world)
    }

    public async delete(id: number) {
        const story = await this.findById(id)
        if (!story.recycle) return await this.update(id, { recycle: true })
        return await this.storyRepo.delete(id)
    }

    public async hasName(name: string) {
        const world = await this.storyRepo.findOne({ name })
        return !!world
    }
}
