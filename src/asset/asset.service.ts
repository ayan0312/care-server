import gm from 'gm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    IAsset,
    IAssetSearch,
    IAssetSearchCondition,
} from 'src/interface/asset.interface'
import { config } from 'src/shared/config'
import { FileMetadata, saveImage } from 'src/shared/image'
import {
    createQueryIds,
    forEachAsync,
    formatDate,
    mergeObjectToEntity,
    parseIds,
    patchQBIds,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { AssetEntity } from './asset.entity'
import { AssetGroupService } from '../assetGroup/assetGroup.service'
import { CharacterService } from 'src/character/character.service'
import { TagService } from 'src/tag/tag.service'
import { CategoryType } from 'src/interface/category.interface'
import { URL } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { AssetSetService } from 'src/assetSet/assetSet.service'

@Injectable()
export class AssetService {
    constructor(
        @InjectRepository(AssetEntity)
        private readonly assetRepo: Repository<AssetEntity>,
        private readonly tagService: TagService,
        private readonly charService: CharacterService,
        private readonly groupService: AssetGroupService,
        private readonly assetSetService: AssetSetService
    ) {}

    private _nameId = 0

    public async findById(
        id: number,
        relations: string[] = [],
        patch: boolean = false
    ) {
        const result = await this.assetRepo.findOne(
            id,
            relations
                ? {
                      relations,
                  }
                : {}
        )
        if (!result) throw new NotFoundException()
        if (patch) return this._patchAssetResult(result)
        return result
    }

    public async findByIds(ids: number[]) {
        return this.assetRepo.findByIds(ids)
    }

    public async *generator(relations?: string[]) {
        let next = 0
        while (true) {
            next++
            let qb = this.assetRepo.createQueryBuilder('asset')

            if (relations)
                relations.forEach((relation) => {
                    qb = qb.leftJoinAndSelect(`asset.${relation}`, relation)
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

    private async _createConditionQB(condition: IAssetSearchCondition) {
        let qb = this.assetRepo
            .createQueryBuilder('asset')
            .where('asset.name like :name', {
                name: `%${condition.name ? condition.name : ''}%`,
            })

        if (condition.tagIds)
            qb = queryQBIds(qb, condition.tagIds, 'asset.tagIds')
        if (condition.groupIds)
            qb = queryQBIds(qb, condition.groupIds, 'asset.groupIds')
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'asset.characterIds')
        if (condition.assetSetIds)
            qb = patchQBIds(
                qb,
                condition.assetSetIds,
                'asset.assetSets',
                'assetSet'
            )
        if (condition.star != null)
            qb = qb.andWhere('asset.star = :star', { star: !!condition.star })
        if (condition.intro != null)
            qb = qb.andWhere('asset.intro like :intro', {
                intro: `%${condition.intro}%`,
            })
        if (condition.remark != null)
            qb = qb.andWhere('asset.remark like :remark', {
                remark: `%${condition.remark}%`,
            })
        if (condition.rating != null)
            qb = qb.andWhere('asset.rating = :rating', {
                rating: condition.rating,
            })

        qb = qb.andWhere('asset.recycle = :recycle', {
            recycle: !!condition.recycle,
        })

        return qb
    }

    public async search(body: IAssetSearch) {
        const {
            condition = { name: '' },
            orderBy = { sort: 'created', order: 'DESC' },
            size = 20,
            page = 1,
        } = body

        let qb = await this._createConditionQB(condition)

        if (orderBy != null)
            qb = qb.orderBy(`asset.${orderBy.sort}`, orderBy.order)

        const data = await qb
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        const rows = data[0]
        await this._patchAssetResults(rows)
        return {
            page: Number(page),
            size: Number(size),
            rows,
            total: data[1],
        }
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

    private async _patchAssetResults(entities: AssetEntity[]) {
        await forEachAsync(entities, async (entity) => {
            await this._patchAssetResult(entity)
        })
    }

    private async _patchAssetResult(entity: AssetEntity) {
        const paths: URL[] = []
        const smallPaths: URL[] = []

        entity.filenames.forEach((filename) => {
            paths.push(new URL(filename, config.URL.ASSETS_PATH))
            smallPaths.push(new URL(filename, config.URL.ASSETS_300_PATH))
        })

        if (entity.groupIds) {
            const groups = await this.groupService.findByIds(
                parseIds(entity.groupIds)
            )
            Object.assign(entity, {
                groups,
            })
        }

        return Object.assign(entity, {
            paths,
            smallPaths,
        })
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

    private async _saveAsset300(metadata: FileMetadata) {
        return new Promise((resolve, reject) => {
            gm(metadata.filename)
                .resize(400, 400)
                .write(`${metadata.path}/300/${metadata.name}`, (err) => {
                    if (err) console.error(err)
                    resolve(undefined)
                })
        })
    }

    private async _copyOrigin300(metadata: FileMetadata) {
        try {
            const a = await saveImage(
                metadata.prefix,
                config.ASSETS_300_PATH,
                metadata.filename
            )
            console.log(a)
        } catch (err) {
            console.log(err)
            return null
        }
    }

    private async _saveAsset(filename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'assets',
            filename
        )

        if (metadata === null) return '/assets/package.png'
        if (metadata.ext !== 'gif') await this._saveAsset300(metadata)
        else await this._copyOrigin300(metadata)
        return metadata.name
    }

    private async _saveAssets(filenames: string[]) {
        const results: string[] = []
        await forEachAsync(filenames, async (filename) => {
            const result = await this._saveAsset(filename)
            results.push(result)
        })
        return results
    }

    private async _mergeBodyToEntity(target: AssetEntity, body: IAsset) {
        mergeObjectToEntity(target, body, [
            'tagIds',
            'groupIds',
            'filenames',
            'assetSetIds',
            'characterIds',
        ])

        if (body.filenames && body.filenames.length > 0) {
            const filenames = await this._saveAssets(body.filenames)
            target.filenames = filenames
        }
        if (body.tagIds != null)
            target.tagIds = createQueryIds(
                (
                    await this.tagService.matchByIds(
                        parseIds(body.tagIds),
                        CategoryType.asset
                    )
                ).map((tag) => tag.id)
            )
        if (body.groupIds != null)
            target.groupIds = createQueryIds(
                (
                    await this.groupService.findByIds(parseIds(body.groupIds))
                ).map((group) => group.id)
            )
        if (body.characterIds != null)
            target.characterIds = createQueryIds(
                (
                    await this.charService.findByIds(
                        parseIds(body.characterIds)
                    )
                ).map((char) => char.id)
            )
        if (body.assetSetIds != null)
            target.assetSets = await this.assetSetService.findByIds(
                parseIds(body.assetSetIds)
            )

        return target
    }

    public async create(body: IAsset) {
        if (!body.name)
            body.name = `${formatDate('y-M-d H:m:s', new Date())}-${this
                ._nameId++}`

        const asset = await this._mergeBodyToEntity(new AssetEntity(), body)
        await throwValidatedErrors(asset)
        return await this.assetRepo.save(asset)
    }

    public async updateByIds(ids: number[], body: IAsset) {
        const errors = []
        for (let i = 0; i < ids.length; i++) {
            try {
                await this.update(ids[i], body)
            } catch (err) {
                errors.push(err)
            }
        }

        return {
            errors,
        }
    }

    public async deleteByIds(ids: number[]) {
        const assets: AssetEntity[] = []
        await forEachAsync(ids, async (id) => {
            const result = await this.delete(id)
            if (result) assets.push(result)
        })
        return assets
    }

    public async update(id: number, body: IAsset) {
        const asset = await this.findById(id)
        await this._mergeBodyToEntity(asset, body)
        await throwValidatedErrors(asset)
        const newPic = await this.assetRepo.save(asset)
        return await this.findById(newPic.id, [], true)
    }

    public async delete(id: number) {
        const asset = await this.findById(id)

        if (!asset.recycle) return await this.update(id, { recycle: true })

        return await this.assetRepo.remove(asset)
    }
}
