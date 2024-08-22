import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { StaticCategoryEntity } from './staticCategory.entity'
import { IStaticCategory } from 'src/interface/staticCategory.interface'
import { CharacterService } from 'src/character/character.service'
import { ModuleRef } from '@nestjs/core'
import { mergeObjectToEntity, throwValidatedErrors } from 'src/shared/utilities'

@Injectable()
export class StaticCategoryService {
    constructor(
        @InjectRepository(StaticCategoryEntity)
        private readonly categoryRepo: Repository<StaticCategoryEntity>,
        private readonly moduleRef: ModuleRef
    ) {}

    private charService: CharacterService

    public onModuleInit() {
        this.charService = this.moduleRef.get(CharacterService, {
            strict: false,
        })
    }

    public async find(name: string) {
        return await this.categoryRepo.findBy({ name })
    }

    public async findAll() {
        return await this.categoryRepo.find({})
    }

    public async findById(id: number) {
        const result = await this.categoryRepo.findOneBy({ id })
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.categoryRepo.findBy({ id: In(ids) })
    }

    public async create(body: IStaticCategory) {
        if (body.name == null)
            throw new BadRequestException('The name cannot be empty')
        if (await this.hasName(body.name))
            throw new ConflictException('There has the same name')

        const category = new StaticCategoryEntity()
        mergeObjectToEntity(category, body)
        await throwValidatedErrors(category)
        return await this.categoryRepo.save(category)
    }

    public async update(id: number, body: IStaticCategory) {
        const category = await this.findById(id)
        if (
            body.name &&
            body.name != category.name &&
            (await this.hasName(body.name))
        )
            throw new ConflictException('has the same name')
        mergeObjectToEntity(category, body)
        await throwValidatedErrors(category)
        return await this.categoryRepo.save(category)
    }

    public async delete(id: number, force: boolean) {
        const category = await this.findById(id)

        if (!force) {
            const char = await this.charService.search({
                page: 1,
                size: 1,
                condition: {
                    staticCategoryIds: String(category.id),
                },
            })

            if (char.total !== 0)
                throw new UnprocessableEntityException({
                    message: `The character "${char.rows[0].name}(${char.rows[0].id})" has this tag.`,
                })
        }

        return await this.categoryRepo.remove(category)
    }

    public async hasName(name: string) {
        return !!(await this.categoryRepo
            .createQueryBuilder('category')
            .where('category.name = :name', { name })
            .getOne())
    }
}
