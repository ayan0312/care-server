import {
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { validate } from 'class-validator'
import { ICharacter, ICharacterSearch } from 'src/interface/character/character.interface'
import { mergeObjectToEntity, parseIds } from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { CharacterEntity } from './character.entity'
import { GroupService } from './group/group.service'
import { TagService } from './tag/tag.service'

@Injectable()
export class CharacterService {
    constructor(
        @InjectRepository(CharacterEntity)
        private readonly charRepo: Repository<CharacterEntity>,
        private readonly tagService: TagService,
        private readonly groupService: GroupService
    ) { }

    public async findById(id: number) {
        const result = await this.charRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return this.charRepo.findByIds(ids)
    }

    public async search(body: ICharacterSearch) {
        const { name = '', size = 20, page = 1 } = body

        const qb = await this.charRepo
            .createQueryBuilder('character')
            .where('character.name=:name', { name })
            .orderBy('created', 'DESC')
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        return {
            page: body.page,
            size: body.size,
            rows: qb[0],
            total: qb[1],
        }
    }

    public async create(body: ICharacter) {
        const char = new CharacterEntity()
        mergeObjectToEntity(char, body, ['tagIds', 'groupIds'])
        if (body.tagIds)
            char.tags = await this.tagService.findByIds(parseIds(body.tagIds))
        if (body.groupIds)
            char.groups = await this.groupService.findByIds(parseIds(body.groupIds))

        const errors = await validate(char)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        return await this.charRepo.save(char)
    }

    public async update(id: number, body: ICharacter) {
        const char = await this.findById(id)
        mergeObjectToEntity(char, body, ['tagIds', 'groupIds'])
        if (body.tagIds)
            char.tags = await this.tagService.findByIds(parseIds(body.tagIds))
        if (body.groupIds)
            char.groups = await this.groupService.findByIds(parseIds(body.groupIds))

        const errors = await validate(char)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        return await this.charRepo.save(char)
    }

    public async delete(id: number) {
        await this.findById(id)
        return await this.charRepo.delete(id)
    }
}
