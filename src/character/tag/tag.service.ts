import {
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { validate } from 'class-validator'
import { Repository } from 'typeorm'
import { CharacterCategoryEntity } from 'src/character/category/category.entity'
import { CategoryService } from 'src/character/category/category.service'
import { CharacterTagEntity } from './tag.entity'
import { ICharacterTag } from 'src/interface/character/tag.interface'
import { mergeObjectToEntity } from 'src/shared/utilities'

@Injectable()
export class TagService {
    constructor(
        @InjectRepository(CharacterTagEntity)
        private readonly tagRepo: Repository<CharacterTagEntity>,
        private readonly categoryService: CategoryService
    ) { }

    public async find(query: ICharacterTag) {
        const opts: { name?: string, category?: CharacterCategoryEntity } = {}

        if (query.name)
            opts.name = query.name

        if (query.categoryId)
            opts.category = await this.categoryService.findById(query.categoryId)

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

    public async create(body: ICharacterTag) {
        const tag = new CharacterTagEntity()
        mergeObjectToEntity(tag, body, ['categoryId'])
        if (body.categoryId)
            tag.category = await this.categoryService.findById(body.categoryId)

        const errors = await validate(tag)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(tag.name))
            throw new ConflictException('has the same name')

        return this.tagRepo.save(tag)
    }

    public async update(
        id: number,
        body: ICharacterTag
    ) {
        const tag = await this.findById(id)
        mergeObjectToEntity(tag, body, ['categoryId'])
        if (body.categoryId)
            tag.category = await this.categoryService.findById(body.categoryId)

        const errors = await validate(tag)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(tag.name))
            throw new ConflictException('has the same name')

        return await this.tagRepo.save(tag)
    }

    public async delete(id: number) {
        await this.findById(id)
        return await this.tagRepo.delete(id)
    }

    public async hasName(name: string) {
        const tag = await this.tagRepo.findOne({ name })
        return !!tag
    }

    public async tranformCategoryRelationByIds(ids: number[]) {
        let tags: CharacterTagEntity[] = await this.tagRepo.findByIds(ids, {
            relations: ['category'],
        })

        const map: Record<
            number,
            CharacterCategoryEntity & { tags: CharacterTagEntity[] }
        > = {}

        tags.forEach((tag) => {
            if (map[tag.category.id])
                map[tag.category.id].tags.push(tag)
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
