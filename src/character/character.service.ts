import {
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { validate } from 'class-validator'
import { ICharacter, ICharacterSearch } from 'src/interface/character/character.interface'
import { config } from 'src/shared/config'
import { patchURL, saveImage } from 'src/shared/image'
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

    private _imageId = 0

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
            .where('character.name like :name', { name: '%' + name + '%' })
            .orderBy('created', 'DESC')
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        return {
            page: Number(page),
            size: Number(size),
            rows: qb[0].map((entity) => patchURL(entity, ['avatar', 'fullLengthPicture'])),
            total: qb[1],
        }
    }

    public async create(body: ICharacter) {
        const char = new CharacterEntity()
        mergeObjectToEntity(char, body, ['tagIds', 'avatar', 'fullLengthPicture', 'groupIds'])
        if (body.tagIds)
            char.tags = await this.tagService.findByIds(parseIds(body.tagIds))
        if (body.groupIds)
            char.groups = await this.groupService.findByIds(parseIds(body.groupIds))
        if (body.avatar)
            char.avatar = '/avatars/' + await this._saveImage(config.STORAGE_PATH + 'avatars', body.avatar)
        if (body.fullLengthPicture)
            char.fullLengthPicture = '/fullLengthPictures/' + await this._saveImage(config.STORAGE_PATH + 'fullLengthPictures', body.fullLengthPicture)

        const errors = await validate(char)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        const newChar = await this.charRepo.save(char)
        return await this.charRepo.findOne(newChar.id)
    }

    private async _saveImage(targetPath: string, filename: string) {
        try {
            const metadata = await saveImage(`${Date.now()}.${++this._imageId}`, targetPath, `${config.TEMP_PATH}/${filename}`, true)
            return metadata.name
        } catch (err) {
            console.log(err)
            return ''
        }
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
