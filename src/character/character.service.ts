import gm from 'gm'
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    ICharacter,
    ICharacterSearch,
    ICharacterSearchCondition,
    ICharacterStaticCategory,
} from 'src/interface/character.interface'
import { config } from 'src/shared/config'
import { FileMetadata, saveImage } from 'src/shared/image'
import {
    createQueryIds,
    mergeObjectToEntity,
    parseIds,
    queryQBIds,
    queryQBIdsForIdMap,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { CharacterEntity } from 'src/character/character.entity'
import { CharacterGroupService } from 'src/characterGroup/characterGroup.service'
import { TagService } from 'src/tag/tag.service'
import { CategoryType } from 'src/interface/category.interface'
import { URL } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { AssetService } from 'src/asset/asset.service'
import { ModuleRef } from '@nestjs/core'
import { StaticCategoryService } from 'src/staticCategory/staticCategory.service'

@Injectable()
export class CharacterService {
    constructor(
        @InjectRepository(CharacterEntity)
        private readonly charRepo: Repository<CharacterEntity>,
        private readonly tagService: TagService,
        private readonly groupService: CharacterGroupService,
        private readonly staticCategoryService: StaticCategoryService,
        private readonly moduleRef: ModuleRef
    ) {}

    private assetService: AssetService

    public onModuleInit() {
        this.assetService = this.moduleRef.get(AssetService, { strict: false })
    }

    public async *generator(relations?: string[]) {
        let next = 0
        while (true) {
            next++
            let qb = this.charRepo.createQueryBuilder('character')

            if (relations)
                relations.forEach((relation) => {
                    qb = qb.leftJoinAndSelect(`character.${relation}`, relation)
                })

            const result = await qb
                .skip(1 * (next - 1))
                .take(1)
                .getManyAndCount()

            if (result[0].length === 0 || next > result[1]) break

            yield {
                data: result[0][0],
                count: result[1],
            }
        }
    }

    public async findById(
        id: number,
        relations: string[] = [],
        patch?: boolean
    ) {
        const result = await this.charRepo.findOne(
            id,
            relations.length > 0
                ? {
                      relations,
                  }
                : {}
        )
        if (!result) throw new NotFoundException()
        if (patch) return await this._patchCharResult(result)
        return result
    }

    public async findByIds(ids: number[], patch?: boolean) {
        const chars = await this.charRepo.findByIds(ids)
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
        if (condition.groupIds)
            qb = queryQBIds(qb, condition.groupIds, 'character.groupIds')
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
        if (condition.remark != null)
            qb = qb.andWhere('character.remark like :remark', {
                remark: `%${condition.remark}%`,
            })
        if (condition.rating != null)
            qb = qb.andWhere('character.rating = :rating', {
                rating: condition.rating,
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

    private async _createPatchedStaticCategories(
        staticCategories: ICharacterStaticCategory
    ) {
        const scIds = Object.keys(staticCategories).map((k) => Number(k))
        const categories = await this.staticCategoryService.findByIds(scIds)
        const values: [string, string][] = []
        categories.forEach((category) => {
            values.push([category.name, staticCategories[category.id]])
        })

        return values
    }

    private _createXSmall(avatar: string, fullLengthPicture: string) {
        return {
            avatar: avatar ? new URL(avatar, config.URL.AVATARS_PATH) : '',
            fullLengthPicture: fullLengthPicture
                ? new URL(
                      fullLengthPicture,
                      config.URL.FULL_LENGTH_PICTURES_PATH
                  )
                : '',
            ['xsmall']: {
                avatar: avatar
                    ? new URL(avatar, config.URL.AVATARS_200_PATH)
                    : '',
                fullLengthPicture: fullLengthPicture
                    ? new URL(
                          fullLengthPicture,
                          config.URL.FULL_LENGTH_PICTURES_300_PATH
                      )
                    : '',
            },
        }
    }

    private async _patchCharResult(entity: CharacterEntity) {
        const result = Object.assign({}, entity)

        const patchedStaticCategories = await this._createPatchedStaticCategories(
            entity.staticCategories
        )

        Object.assign(
            result,
            this._createXSmall(entity.avatar, entity.fullLengthPicture),
            {
                patchedStaticCategories,
                groups: [],
                relationships: [],
            }
        )

        if (entity.groupIds) {
            const groups = await this.groupService.findByIds(
                parseIds(entity.groupIds)
            )
            Object.assign(result, {
                groups,
            })
        }

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
                uuidv4(),
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

    private async _saveAvatar200(metadata: FileMetadata) {
        return new Promise((resolve, reject) => {
            gm(metadata.filename)
                .resize(200, 200, '!')
                .write(`${metadata.path}/200/${metadata.name}`, (err) => {
                    if (err) console.error(err)
                    resolve(undefined)
                })
        })
    }

    private async _saveAvatar(tempFilename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'avatars',
            tempFilename
        )

        if (metadata === null) return '/avatars/package.png'

        await this._saveAvatar200(metadata)

        return metadata.name
    }

    private async _saveFullLengthPicture300(metadata: FileMetadata) {
        return new Promise((resolve, reject) => {
            gm(metadata.filename)
                .resize(300)
                .write(`${metadata.path}/300/${metadata.name}`, (err) => {
                    if (err) console.error(err)
                    resolve(undefined)
                })
        })
    }

    private async _saveFullLengthPicture(tempFilename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'fullLengthPictures',
            tempFilename
        )

        if (metadata === null) return '/fullLengthPictures/package.png'

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
            'groupIds',
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
        if (body.groupIds != null)
            target.groupIds = createQueryIds(
                (
                    await this.groupService.findByIds(parseIds(body.groupIds))
                ).map((group) => group.id)
            )
        if (body.avatar) target.avatar = await this._saveAvatar(body.avatar)
        if (body.fullLengthPicture)
            target.fullLengthPicture = await this._saveFullLengthPicture(
                body.fullLengthPicture
            )
        return target
    }

    public async save(body: ICharacter) {
        const char = new CharacterEntity()
        mergeObjectToEntity(char, body, ['tagIds', 'groupIds'])
        if (body.tagIds != null)
            char.tagIds = createQueryIds(
                (
                    await this.tagService.matchByIds(
                        parseIds(body.tagIds),
                        CategoryType.character
                    )
                ).map((tag) => tag.id)
            )
        if (body.groupIds != null)
            char.groupIds = createQueryIds(
                (
                    await this.groupService.findByIds(parseIds(body.groupIds))
                ).map((group) => group.id)
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
        return this.findById(id, [], true)
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

        return await this.charRepo.remove(char)
    }
}
