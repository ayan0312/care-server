import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { TagEntity } from './tag.entity'
import { CategoryEntity } from 'src/category/category.entity'
import { CategoryService } from 'src/category/category.service'
import { mergeObjectToEntity, throwValidatedErrors } from 'src/shared/utilities'
import { CategoryType } from 'src/interface/category.interface'
import { ITag } from 'src/interface/tag.interface'
import { CharacterService } from 'src/character/character.service'
import { ModuleRef } from '@nestjs/core'
import { AssetService } from 'src/asset/asset.service'

@Injectable()
export class TagService {
    constructor(
        @InjectRepository(TagEntity)
        private readonly tagRepo: Repository<TagEntity>,
        private readonly categoryService: CategoryService,
        private readonly moduleRef: ModuleRef
    ) {}

    private charService: CharacterService
    private asssetService: AssetService

    public onModuleInit() {
        this.charService = this.moduleRef.get(CharacterService, {
            strict: false,
        })

        this.asssetService = this.moduleRef.get(AssetService, {
            strict: false,
        })
    }

    public async find(query: ITag) {
        return await this.tagRepo.find({
            relations: {
                category: true,
            },
            where: {
                name: query.name,
                category: { id: query.categoryId },
            },
        })
    }

    public async findById(id: number) {
        const result = await this.tagRepo.findOne({
            relations: {
                category: true,
            },
            where: {
                id,
            },
        })
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.tagRepo.findBy({
            id: In(ids),
        })
    }

    public async matchByIds(ids: number[], type: CategoryType) {
        const tags = await this.findRelationsByIds(ids)
        const result = tags.every((tag) => {
            if (
                tag.category.type === CategoryType.common ||
                tag.category.type === type
            )
                return true
            return false
        })

        if (result) return tags
        throw 'unmatch tag'
    }

    public async findRelations() {
        return await this.tagRepo.find({
            relations: ['category'],
        })
    }

    public async findRelationsByIds(ids: number[]) {
        return await this.tagRepo.find({
            where: { id: In(ids) },
            relations: ['category'],
        })
    }

    public async create(body: ITag) {
        const tag = new TagEntity()

        mergeObjectToEntity(tag, body, ['categoryId'])
        if (body.categoryId)
            tag.category = await this.categoryService.findById(body.categoryId)

        await throwValidatedErrors(tag)
        if (await this.hasName(tag.category, tag.name))
            throw new ConflictException('has the same name')

        return this.tagRepo.save(tag)
    }

    public async update(id: number, body: ITag) {
        const tag = await this.findById(id)
        mergeObjectToEntity(tag, body, ['categoryId'])
        if (body.categoryId)
            tag.category = await this.categoryService.findById(body.categoryId)
        await throwValidatedErrors(tag)
        if (
            tag.name != body.name &&
            (await this.hasName(tag.category, tag.name))
        )
            throw new ConflictException('has the same name')

        return await this.tagRepo.save(tag)
    }

    public async delete(id: number) {
        const tag = await this.findById(id)
        const char = await this.charService.search({
            page: 1,
            size: 1,
            condition: {
                tagIds: String(tag.id),
            },
        })

        if (char.total !== 0)
            throw new UnprocessableEntityException({
                message: `The character "${char.rows[0].name}(${char.rows[0].id})" has this tag.`,
            })

        const asset = await this.asssetService.search({
            page: 1,
            size: 1,
            condition: {
                tagIds: String(tag.id),
            },
        })

        if (asset.total !== 0)
            throw new UnprocessableEntityException({
                message: `The asset "${asset.rows[0].name}(${asset.rows[0].id})" has this tag.`,
            })

        return await this.tagRepo.remove(tag)
    }

    public async hasName(category: CategoryEntity, name: string) {
        const tag = await this.tagRepo.findOne({
            where: {
                name,
                category: {
                    id: category.id,
                },
            },
        })
        return !!tag
    }

    public async tranformCategoryRelationByIds(ids: number[]) {
        let tags: TagEntity[] = await this.findRelationsByIds(ids)

        const map: Record<number, CategoryEntity & { tags: TagEntity[] }> = {}

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
