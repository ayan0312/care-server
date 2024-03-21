import gm from 'gm'
import path from 'path'
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { URL } from 'url'

import {
    ICharacter,
    ICharacterSearch,
    ICharacterSearchCondition,
    ICharacterStaticCategory,
} from 'src/interface/character.interface'
import { config } from 'src/shared/config'
import {
    FileMetadata,
    getImageSize,
    getPrefix,
    readDirSync,
    rmSync,
    saveImage,
} from 'src/shared/file'
import {
    createQueryIds,
    forEachAsync,
    mergeObjectToEntity,
    parseIds,
    queryQBIds,
    queryQBIdsForIdMap,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { CharacterEntity } from 'src/character/character.entity'
import { TagService } from 'src/tag/tag.service'
import { CategoryType } from 'src/interface/category.interface'
import { AssetService } from 'src/asset/asset.service'
import { StaticCategoryService } from 'src/staticCategory/staticCategory.service'

@Injectable()
export class CharacterService {
    constructor(
        @InjectRepository(CharacterEntity)
        private readonly charRepo: Repository<CharacterEntity>,
        private readonly tagService: TagService,
        private readonly staticCategoryService: StaticCategoryService,
        private readonly moduleRef: ModuleRef
    ) {}

    private _imageId = 0

    private assetService: AssetService

    public onModuleInit() {
        this.assetService = this.moduleRef.get(AssetService, { strict: false })
    }

    public async *generator() {
        let next = 0
        while (true) {
            next++
            let qb = this.charRepo.createQueryBuilder('character')

            const result = await qb
                .skip(1 * (next - 1))
                .take(1)
                .getManyAndCount()

            if (result[0].length === 0 || next > result[1]) break
            const data = result[0][0]
            data.staticCategories = (await this._createFeatures(
                data.staticCategories
            )) as any
            yield {
                data,
                count: result[1],
            }
        }
    }

    public async findById(id: number, patch?: boolean) {
        const result = await this.charRepo.findOne({
            where: { id },
        })
        if (!result) throw new NotFoundException()
        if (patch) return await this._patchCharResult(result)
        return result
    }

    public async findByIds(ids: number[], patch?: boolean) {
        const chars = await this.charRepo.findBy({ id: In(ids) })
        if (patch) await this._patchCharResults(chars)
        return chars
    }

    public async findCategoryRelationsById(id: number) {
        const char = await this.findById(id)
        return await this.tagService.tranformCategoryRelationByIds(
            parseIds(char.tagIds)
        )
    }

    private _createConditionQB(condition: ICharacterSearchCondition) {
        let qb = this.charRepo.createQueryBuilder('character')

        if (condition.name != null)
            qb = qb.where('character.name like :name', {
                name: `%${condition.name}%`,
            })
        if (condition.tagIds)
            qb = queryQBIds(qb, condition.tagIds, 'character.tagIds')
        if (condition.staticCategoryIds != null)
            qb = queryQBIdsForIdMap(
                qb,
                condition.staticCategoryIds,
                'character.staticCategories'
            )
        if (condition.star != null)
            qb = qb.andWhere('character.star = :star', {
                star: !!condition.star,
            })
        if (condition.intro != null)
            qb = qb.andWhere('character.intro like :intro', {
                intro: `%${condition.intro}%`,
            })
        if (condition.rating != null)
            qb = qb.andWhere('character.rating = :rating', {
                rating: condition.rating,
            })

        qb = qb.andWhere('character.template = :template', {
            template: !!condition.template,
        })

        qb = qb.andWhere('character.recycle = :recycle', {
            recycle: !!condition.recycle,
        })

        return qb
    }

    public async search(body: ICharacterSearch) {
        const {
            condition = {},
            orderBy = { sort: 'created', order: 'DESC' },
            size = 20,
            page = 1,
        } = body

        let qb = this._createConditionQB(condition)
        if (orderBy != null)
            qb = qb.orderBy(`character.${orderBy.sort}`, orderBy.order)

        const data = await qb
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        const rows = data[0]
        await this._patchCharResults(rows)

        return {
            page: Number(page),
            size: Number(size),
            rows,
            total: data[1],
        }
    }

    private async _createFeatures(staticCategories: ICharacterStaticCategory) {
        const scIds = Object.keys(staticCategories).map((k) => Number(k))
        const categories = await this.staticCategoryService.findByIds(scIds)
        const features: Record<string, object> = {}
        categories.forEach((category) => {
            features[category.name] = {
                id: category.id,
                origin: staticCategories[category.id],
            }
        })
        return features
    }

    private _createXSmall(avatar: string, fullLengthPicture: string) {
        const xs = {
            avatar: avatar ? new URL(avatar, config.URL.avatar_thumbs) : '',
            fullLengthPicture: fullLengthPicture
                ? new URL(fullLengthPicture, config.URL.fullbody_thumbs)
                : '',
        }
        return {
            avatar: avatar ? new URL(avatar, config.URL.avatars) : '',
            fullLengthPicture: fullLengthPicture
                ? new URL(fullLengthPicture, config.URL.fullbodys)
                : '',
            xs,
            // legacy
            xsmall: xs,
        }
    }

    private async _patchCharResult(entity: CharacterEntity) {
        const result = Object.assign({}, entity)
        const features = await this._createFeatures(entity.staticCategories)

        if (result.tagIds) {
            const tags = await this.tagService.findRelationsByIds(
                parseIds(result.tagIds)
            )

            Object.assign(result, { tags })
        }

        Object.assign(
            result,
            this._createXSmall(entity.avatar, entity.fullLengthPicture),
            {
                features,
                // relations: [],
            }
        )

        return result
    }

    private async _patchCharResults(entities: CharacterEntity[]) {
        for (let index in entities) {
            entities[index] = await this._patchCharResult(entities[index])
        }
    }

    private async _saveImage(targetPath: string, filename: string) {
        try {
            const metadata = await saveImage(
                `${Date.now()}_${++this._imageId}`,
                targetPath,
                path.join(config.static.temps, filename),
                true
            )
            return metadata
        } catch (err) {
            console.log(err)
            return null
        }
    }

    private async _saveAvatar200(metadata: FileMetadata) {
        return new Promise((resolve, reject) => {
            gm(metadata.filename)
                .resize(200, 200, '!')
                .write(
                    path.join(config.static.avatar_thumbs, metadata.name),
                    (err) => {
                        if (err) console.error(err)
                        resolve(undefined)
                    }
                )
        })
    }

    private async _saveAvatar(tempFilename: string) {
        const metadata = await this._saveImage(
            config.static.avatars,
            tempFilename
        )

        if (metadata === null) return path.join('/avatars/package.png')

        await this._saveAvatar200(metadata)

        return metadata.name
    }

    private async _saveFullLengthPicture300(metadata: FileMetadata) {
        const size = await getImageSize(metadata.filename)
        let maxWidth = 400,
            maxHeight = 700
        if (size.width > size.height) {
            maxWidth = 700
            maxHeight = 400
        }
        return new Promise((resolve, reject) => {
            gm(metadata.filename)
                .resize(maxWidth, maxHeight, '>')
                .write(
                    path.join(config.static.fullbody_thumbs, metadata.name),
                    (err) => {
                        if (err) console.error(err)
                        resolve(undefined)
                    }
                )
        })
    }

    private async _saveFullLengthPicture(tempFilename: string) {
        const metadata = await this._saveImage(
            config.static.fullbodys,
            tempFilename
        )

        if (metadata === null)
            return path.join('/fullLengthPictures/package.png')

        await this._saveFullLengthPicture300(metadata)

        return metadata.name
    }

    private async _mergeBodyToEntity(
        target: CharacterEntity,
        body: ICharacter
    ) {
        mergeObjectToEntity(target, body, [
            'tagIds',
            'avatar',
            'fullLengthPicture',
        ])
        if (body.tagIds != null)
            target.tagIds = createQueryIds(
                (
                    await this.tagService.matchByIds(
                        parseIds(body.tagIds),
                        CategoryType.character
                    )
                ).map((tag) => tag.id)
            )
        if (body.avatar) {
            if (target.avatar) await this.removeAvatar(target.avatar)
            target.avatar = await this._saveAvatar(body.avatar)
        }
        if (body.fullLengthPicture) {
            if (target.fullLengthPicture)
                await this.removeFullbody(target.fullLengthPicture)
            target.fullLengthPicture = await this._saveFullLengthPicture(
                body.fullLengthPicture
            )
        }
        return target
    }

    public async save(body: ICharacter) {
        const char = new CharacterEntity()
        mergeObjectToEntity(char, body, ['tagIds'])
        if (body.tagIds != null)
            char.tagIds = createQueryIds(
                (
                    await this.tagService.matchByIds(
                        parseIds(body.tagIds),
                        CategoryType.character
                    )
                ).map((tag) => tag.id)
            )

        await throwValidatedErrors(char)
        return await this.charRepo.save(char)
    }

    public async create(body: ICharacter) {
        const char = await this._mergeBodyToEntity(new CharacterEntity(), body)
        await throwValidatedErrors(char)
        return await this.charRepo.save(char)
    }

    public async update(id: number, body: ICharacter) {
        const char = await this.findById(id)
        await this._mergeBodyToEntity(char, body)
        await throwValidatedErrors(char)
        await this.charRepo.save(char)
        return this.findById(id, true)
    }

    // deprecated
    public async deleteExtraAssets() {
        const bigAvatarPaths = readDirSync(config.static.avatars)
        const bigFullbodyPaths = readDirSync(config.static.fullbodys)
        const smallAvatarPaths = readDirSync(config.static.avatar_thumbs)
        const smallFullbodyPaths = readDirSync(config.static.fullbody_thumbs)
        const allChars = await this.charRepo.find()
        const bucket: Record<string, boolean> = {}
        let total = 0

        allChars.forEach((char) => {
            if (char.avatar) bucket[char.avatar] = true
            if (char.fullLengthPicture) bucket[char.fullLengthPicture] = true
        })

        await forEachAsync(bigAvatarPaths, async (filename) => {
            if (!bucket[filename]) {
                console.log('remove to bin: ', filename)
                await saveImage(
                    `${filename}-avatar`,
                    config.static.bin,
                    path.join(config.static.avatars, filename),
                    true
                )
                total++
            }
        })

        smallAvatarPaths.forEach((filename) => {
            if (!bucket[filename]) {
                console.log('remove 200: ', filename)
                rmSync(path.join(config.static.avatar_thumbs, filename))
                total++
            }
        })

        await forEachAsync(bigFullbodyPaths, async (filename) => {
            if (!bucket[filename]) {
                console.log('remove to bin: ', filename)
                await saveImage(
                    `${filename}-fullbody`,
                    config.static.bin,
                    path.join(config.static.fullbodys, filename),
                    true
                )
                total++
            }
        })

        smallFullbodyPaths.forEach((filename) => {
            if (!bucket[filename]) {
                console.log('remove 300: ', filename)
                rmSync(path.join(config.static.fullbody_thumbs, filename))
                total++
            }
        })

        return `remove ${total} extra assets`
    }

    private async removeAvatar(avatar: string) {
        await saveImage(
            `avatar-${getPrefix(avatar)}`,
            config.static.bin,
            path.join(config.static.avatars, avatar),
            true
        )
        rmSync(path.join(config.static.avatar_thumbs, avatar))
    }

    private async removeFullbody(fullbody: string) {
        await saveImage(
            `fullbody-${getPrefix(fullbody)}`,
            config.static.bin,
            path.join(config.static.fullbodys, fullbody),
            true
        )
        rmSync(path.join(config.static.fullbody_thumbs, fullbody))
    }

    public async delete(id: number) {
        const char = await this.findById(id)

        if (!char.recycle) return await this.update(id, { recycle: true })

        const result = await this.assetService.search({
            page: 1,
            size: 1,
            condition: {
                characterIds: String(id),
            },
        })

        if (result.rows.length > 0)
            throw new BadRequestException(
                'please remove all assets in character before delete character'
            )

        if (char.avatar) await this.removeAvatar(char.avatar)
        if (char.fullLengthPicture)
            await this.removeFullbody(char.fullLengthPicture)

        return await this.charRepo.remove(char)
    }
}
