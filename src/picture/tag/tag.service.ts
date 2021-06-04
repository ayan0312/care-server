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
import { PictureCategoryEntity } from 'src/picture/category/category.entity'
import { CategoryService } from 'src/picture/category/category.service'
import { PictureTagEntity } from './tag.entity'
import { IPictureTag } from 'src/interface/picture/tag.interface'
import { mergeObjectToEntity } from 'src/shared/utilities'
import { PictureEntity } from '../picture.entity'

@Injectable()
export class TagService {
    constructor(
        @InjectRepository(PictureTagEntity)
        private readonly tagRepo: Repository<PictureTagEntity>,
        private readonly categoryService: CategoryService
    ) { }

    public async find(query: IPictureTag) {
        const opts: { name?: string; category?: PictureCategoryEntity } = {}

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

    public async create(body: IPictureTag) {
        const tag = new PictureTagEntity()
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

    public async update(id: number, body: IPictureTag) {
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
        const tag = await this.findById(id)
        const result = await this.tagRepo
            .createQueryBuilder()
            .relation('pictures')
            .of(tag)
            .loadOne<PictureEntity>()

        if (result)
            throw new UnprocessableEntityException()
        return await this.tagRepo.remove(tag)
    }

    public async hasName(name: string) {
        const tag = await this.tagRepo.findOne({ name })
        return !!tag
    }

    public async tranformCategoryRelationByIds(ids: number[]) {
        let tags: PictureTagEntity[] = await this.tagRepo.findByIds(ids, {
            relations: ['category'],
        })

        const map: Record<
            number,
            PictureCategoryEntity & { tags: PictureTagEntity[] }
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
