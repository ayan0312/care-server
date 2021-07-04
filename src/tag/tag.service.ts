import {
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { validate } from 'class-validator'
import { Repository } from 'typeorm'
import { TagEntity } from './tag.entity'
import { CategoryEntity } from 'src/category/category.entity'
import { CategoryService } from 'src/category/category.service'
import { mergeObjectToEntity } from 'src/shared/utilities'
import { CategoryType } from 'src/interface/category.interface'
import { ITag } from 'src/interface/tag.interface'

@Injectable()
export class TagService {
    constructor(
        @InjectRepository(TagEntity)
        private readonly tagRepo: Repository<TagEntity>,
        private readonly categoryService: CategoryService
    ) { }

    public async find(query: ITag) {
        const opts: { name?: string; category?: CategoryEntity } = {}

        if (query.name) opts.name = query.name

        if (query.categoryId)
            opts.category = await this.categoryService.findById(
                query.categoryId
            )

        return await this.tagRepo.find(opts)
    }

    public async findById(id: number) {
        const result = await this.tagRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.tagRepo.findByIds(ids)
    }

    public async checkTagTypeByIds(ids: number[], type: CategoryType) {
        const tags = await this.findRelationsByIds(ids)
        return tags.every(tag => {
            if (
                tag.category.type === CategoryType.common
                || tag.category.type === type
            ) return true
            return false
        })
    }

    public async findRelations() {
        return await this.tagRepo.find({
            relations: ['category'],
        })
    }

    public async findRelationsByIds(ids: number[]) {
        return await this.tagRepo.findByIds(ids, {
            relations: ['category'],
        })
    }

    public async create(body: ITag) {
        const tag = new TagEntity()
        mergeObjectToEntity(tag, body, ['categoryId'])
        if (body.categoryId)
            tag.category = await this.categoryService.findById(body.categoryId)

        const errors = await validate(tag)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(tag.category, tag.name))
            throw new ConflictException('has the same name')

        return this.tagRepo.save(tag)
    }

    public async update(id: number, body: ITag) {
        const tag = await this.findById(id)
        mergeObjectToEntity(tag, body, ['categoryId'])
        if (body.categoryId)
            tag.category = await this.categoryService.findById(body.categoryId)

        const errors = await validate(tag)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(tag.category, tag.name))
            throw new ConflictException('has the same name')

        return await this.tagRepo.save(tag)
    }

    public async delete(id: number) {
        const tag = await this.findById(id)
        const result = await this.tagRepo
            .createQueryBuilder()
            .relation('characters')
            .of(tag)
            .loadOne<CategoryEntity>()

        if (result)
            throw new UnprocessableEntityException()
        return await this.tagRepo.remove(tag)
    }

    public async matchTagIds(tagIds: number[], type: CategoryType) {
        if (await this.checkTagTypeByIds(tagIds, type))
            return tagIds.sort((a, b) => a - b)
        throw 'unmatch tag'
    }

    public async hasName(category: CategoryEntity, name: string) {
        const tag = await this.tagRepo.findOne({ category, name })
        return !!tag
    }

    public async tranformCategoryRelationByIds(ids: number[]) {
        let tags: TagEntity[] = await this.tagRepo.findByIds(ids, {
            relations: ['category'],
        })

        const map: Record<
            number,
            CategoryEntity & { tags: TagEntity[] }
        > = {}

        tags.forEach((tag) => {
            if (map[tag.category.id]) map[tag.category.id].tags.push(tag)
            else
                map[tag.category.id] = Object.assign(tag.category, {
                    tags: [tag],
                })

            delete (tag as any).category
        })

        return Object.keys(map)
            .map((key) => Number(key))
            .sort((a, b) => a - b)
            .map((id) => map[id])
    }
}