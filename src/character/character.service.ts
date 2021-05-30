import gm from 'gm'
import {
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { validate } from 'class-validator'
import {
    ICharacter,
    ICharacterSearch,
} from 'src/interface/character/character.interface'
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

    public async findById(id: number, relations: string[] = []) {
        const result = await this.charRepo.findOne(
            id,
            relations
                ? {
                    relations,
                }
                : {}
        )
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
            rows: qb[0].map((entity) => {
                patchURL(entity, ['avatar', 'fullLengthPicture'])
                return Object.assign({}, entity, {
                    ['xsmall']: {
                        avatar: entity.avatar.replace('avatars', 'avatars/200'),
                        fullLengthPicture: entity.fullLengthPicture.replace('fullLengthPictures', 'fullLengthPictures/300')
                    }
                })
            }),
            total: qb[1],
        }
    }

    private async _saveImage(targetPath: string, filename: string) {
        try {
            const metadata = await saveImage(
                `${Date.now()}.${++this._imageId}`,
                targetPath,
                `${config.TEMP_PATH}/${filename}`,
                true
            )
            return metadata
        } catch (err) {
            console.log(err)
            return null
        }
    }

    private async _saveAvatar(tempFilename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'avatars',
            tempFilename
        )

        if (metadata === null)
            return '/avatars/package.png'

        gm(metadata.filename)
            .resize(200, 200, '!')
            .write(`${metadata.path}/200/${metadata.name}`, (err) => {
                if (err)
                    console.error(err)
            })

        return '/avatars/' + metadata.name
    }

    private async _saveFullLengthPicture(tempFilename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'fullLengthPictures',
            tempFilename
        )

        if (metadata === null)
            return '/fullLengthPictures/package.png'

        gm(metadata.filename)
            .resize(300)
            .write(`${metadata.path}/300/${metadata.name}`, (err) => {
                if (err)
                    console.error(err)
            })

        return '/fullLengthPictures/' + metadata.name
    }

    private async _mergeBodyToEntity(
        target: CharacterEntity,
        body: ICharacter
    ) {
        mergeObjectToEntity(target, body, [
            'tagIds',
            'avatar',
            'groupIds',
            'fullLengthPicture',
        ])
        if (body.tagIds)
            target.tags = await this.tagService.findByIds(parseIds(body.tagIds))
        if (body.groupIds)
            target.groups = await this.groupService.findByIds(
                parseIds(body.groupIds)
            )
        if (body.avatar)
            target.avatar = await this._saveAvatar(body.avatar)
        if (body.fullLengthPicture)
            target.fullLengthPicture = await this._saveFullLengthPicture(body.fullLengthPicture)
        return target
    }

    public async create(body: ICharacter) {
        const char = await this._mergeBodyToEntity(new CharacterEntity(), body)

        const errors = await validate(char)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        const newChar = await this.charRepo.save(char)
        return await this.charRepo.findOne(newChar.id)
    }

    public async update(id: number, body: ICharacter) {
        const char = await this.findById(id)
        await this._mergeBodyToEntity(char, body)

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
