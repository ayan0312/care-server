import {
    BadRequestException,
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
import { TagEntity } from 'src/tag/tag.entity'
import { StaticCategoryEntity } from './staticCategory.entity'
import { IStaticCategory } from 'src/interface/staticCategory.interface'

@Injectable()
export class StaticCategoryService {
    constructor(
        @InjectRepository(StaticCategoryEntity)
        private readonly categoryRepo: Repository<StaticCategoryEntity>
    ) {}

    public async find(name?: string) {
        return await this.categoryRepo.find(name ? { name } : {})
    }

    public async findById(id: number) {
        const result = await this.categoryRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async create(body: IStaticCategory) {
        if (body.name == null)
            throw new BadRequestException('name cannot be empty')
        if (await this.hasName(body.name))
            throw new ConflictException('has the same name')

        const category = new StaticCategoryEntity()
        category.name = body.name
        if (body.intro) category.intro = body.intro
        if (body.script) category.script = body.script

        const errors = await validate(category)

        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        return await this.categoryRepo.save(category)
    }

    public async rename(id: number, name: string) {
        if (await this.hasName(name))
            throw new ConflictException('has the same name')

        return await this.categoryRepo.update(id, { name })
    }

    public async delete(id: number) {
        const category = await this.findById(id)
        const result = await this.categoryRepo
            .createQueryBuilder()
            .relation('tags')
            .of(category)
            .loadOne<TagEntity>()

        if (result) throw new UnprocessableEntityException()
        return await this.categoryRepo.remove(category)
    }

    public async hasName(name: string) {
        return !!(await this.categoryRepo
            .createQueryBuilder('category')
            .where('category.name = :name', { name })
            .getOne())
    }
}
