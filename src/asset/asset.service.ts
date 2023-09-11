import path from 'path'
import { In, Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import {
    AssetType,
    IAsset,
    IAssetSearch,
    IAssetSearchCondition,
} from 'src/interface/asset.interface'
import { config } from 'src/shared/config'
import {
    autoMkdirSync,
    getAssetThumbs,
    getExt,
    getPrefix,
    readDirSync,
    rmDirSync,
    rmSync,
    saveFiles,
    saveFolder,
    saveImage,
    sortFilenames,
} from 'src/shared/file'
import {
    arrayDifference,
    arrayIntersection,
    arrayUnique,
    createQueryIds,
    forEachAsync,
    formatDate,
    isNumber,
    mergeObjectToEntity,
    parseIds,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { CharacterService } from 'src/character/character.service'
import { TagService } from 'src/tag/tag.service'
import { CategoryType } from 'src/interface/category.interface'

import { AssetEntity } from './asset.entity'

export type DiffColumn = 'tagIds' | 'characterIds'

@Injectable()
export class AssetService {
    constructor(
        @InjectRepository(AssetEntity)
        private readonly assetRepo: Repository<AssetEntity>,
        private readonly tagService: TagService,
        private readonly charService: CharacterService
    ) {}

    private _nameId = 0
    private _imageId = 0

    public async findById(id: number, patch = false) {
        const result = await this.assetRepo.findOne({
            where: {
                id,
            },
        })
        if (!result) throw new NotFoundException()
        if (patch) return this._patchAssetResult(result, true)
        return result
    }

    public async findByIds(ids: number[], patch = false) {
        const assets = await this.assetRepo.findBy({ id: In(ids) })
        if (patch) await this._patchAssetResults(assets)
        return assets
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

    public async removeUnstarAssets(recycle = false) {
        if (recycle) {
            const results = await this.assetRepo.find({
                where: {
                    recycle,
                    star: false,
                },
            })
            await forEachAsync(results, async (asset) => {
                await this.delete(asset)
            })
        } else {
            await this.assetRepo.update(
                {
                    recycle,
                    star: false,
                },
                { recycle: true }
            )
        }
    }

    public async findNearAssetsById(id: number, left: number, right: number) {
        const asset = await this.findById(id)

        let qb = this.assetRepo.createQueryBuilder('asset')
        let leftAssets: AssetEntity[] = []
        let rightAssets: AssetEntity[] = []
        let leftTotal = 0
        let rightTotal = 0

        if (left > 0) {
            const [assets, total] = await qb
                .where('asset.recycle = :recycle', {
                    recycle: !!asset.recycle,
                })
                .andWhere('asset.id < :id', {
                    id: id,
                })
                .orderBy(`asset.id`, 'DESC')
                .take(left)
                .getManyAndCount()
            leftAssets = assets
            leftTotal = total
        }

        if (right > 0) {
            const [assets, total] = await qb
                .where('asset.recycle = :recycle', {
                    recycle: !!asset.recycle,
                })
                .andWhere('asset.id > :id', {
                    id: id,
                })
                .orderBy(`asset.id`, 'ASC')
                .take(right)
                .getManyAndCount()
            rightAssets = assets
            rightTotal = total
        }

        await this._patchAssetResults(leftAssets)
        await this._patchAssetResults(rightAssets)

        return {
            left: leftAssets,
            leftTotal,
            right: rightAssets,
            rightTotal,
        }
    }

    private async _createConditionQB(condition: IAssetSearchCondition) {
        let qb = this.assetRepo
            .createQueryBuilder('asset')
            .where('asset.name like :name', {
                name: `%${condition.name ? condition.name : ''}%`,
            })
        if (condition.tagIds)
            qb = queryQBIds(
                qb,
                condition.tagIds,
                'asset.tagIds',
                condition?.reverse?.tagIds
            )
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'asset.characterIds')
        if (condition.star != null)
            qb = qb.andWhere('asset.star = :star', { star: !!condition.star })
        if (condition.intro != null)
            qb = qb.andWhere('asset.intro like :intro', {
                intro: `%${condition.intro}%`,
            })
        if (condition.rating != null)
            qb = qb.andWhere('asset.rating = :rating', {
                rating: condition.rating,
            })

        qb = qb.andWhere('asset.template = :template', {
            template: !!condition.template,
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

    // TODO
    public async mergeTo(selfId: number, targetId: number) {}

    private async _patchAssetResults(entities: AssetEntity[]) {
        await forEachAsync(entities, async (entity) => {
            await this._patchAssetResult(entity)
        })
    }

    private async _patchAssetResult(entity: AssetEntity, thumb = false) {
        Object.assign(entity, { tags: [] })
        if (entity.tagIds) {
            const tags = await this.tagService.findRelationsByIds(
                parseIds(entity.tagIds)
            )

            Object.assign(entity, { tags })
        }

        if (entity.path) {
            const thumbs = await this.getAssetThumbs(entity.id)
            const total = thumbs.length
            const displayThumbs = thumb ? thumbs : thumbs.splice(0, 3)
            Object.assign(entity, {
                total,
                thumbs: displayThumbs,
                details: displayThumbs.map((thumb) => ({
                    thumb,
                    ext: getExt(thumb),
                })),
            })
        }

        Object.assign(entity, { chars: [] })
        if (entity.characterIds) {
            const chars = await this.charService.findByIds(
                parseIds(entity.characterIds),
                true
            )
            Object.assign(entity, { chars })
        }

        return entity
    }

    public async getAssetThumbs(id: number) {
        const asset = await this.findById(id)
        if (asset.assetType == AssetType.files)
            autoMkdirSync(path.join(config.static.asset_thumbs, asset.path))
        return getAssetThumbs(asset.path, (origin) => {
            return `/api/assets/thumb?filename=${origin}`
        })
    }

    private async _initAssets(target: AssetEntity, body: IAsset) {
        if (body.folder && body.assetType === AssetType.folder) {
            target.path = await saveFolder(body.folder)
            return
        }
        let filenames = body.filenames
        if (body.folder) filenames = sortFilenames(readDirSync(body.folder))
        if (!filenames || filenames.length < 0) return
        if (filenames.length === 1) target.assetType = AssetType.file
        else target.assetType = AssetType.files
        const name = `${Date.now()}_${++this._imageId}`
        if (body.folder)
            target.path = await saveFiles(name, filenames, body.folder, false)
        else target.path = await saveFiles(name, filenames, config.static.temps)
    }

    private async _mergeBodyToEntity(target: AssetEntity, body: IAsset) {
        mergeObjectToEntity(target, body, [
            'tagIds',
            'folder',
            'filenames',
            'characterIds',
        ])

        await this._initAssets(target, body)

        if (body.tagIds != null)
            target.tagIds = createQueryIds(
                (
                    await this.tagService.matchByIds(
                        parseIds(body.tagIds),
                        CategoryType.asset
                    )
                ).map((tag) => tag.id)
            )
        if (body.characterIds != null)
            target.characterIds = createQueryIds(
                (
                    await this.charService.findByIds(
                        parseIds(body.characterIds)
                    )
                ).map((char) => char.id)
            )

        return target
    }

    public async create(body: IAsset) {
        if (!body.name)
            body.name = `${formatDate('y-M-d H:m:s', new Date())}-${++this
                ._nameId}`

        const asset = await this._mergeBodyToEntity(new AssetEntity(), body)
        await throwValidatedErrors(asset)
        return await this.assetRepo.save(asset)
    }

    public async findCategoryRelationsById(id: number) {
        const asset = await this.findById(id)
        return await this.tagService.tranformCategoryRelationByIds(
            parseIds(asset.tagIds)
        )
    }

    public async updateByIds(
        ids: number[],
        body: IAsset,
        diffs: DiffColumn[] = []
    ) {
        const errors = []
        const assets = await this.findByIds(ids)
        const tagIds: number[] = body.tagIds ? parseIds(body.tagIds) : []
        const removedTagIds =
            tagIds.length > 0
                ? arrayDifference(
                      arrayIntersection(
                          ...assets.map((entity) => parseIds(entity.tagIds))
                      ),
                      tagIds
                  )
                : []
        for (let asset of assets) {
            try {
                if (diffs.includes('tagIds') && tagIds.length > 0) {
                    const assetIds = arrayUnique(
                        [
                            tagIds,
                            arrayDifference(
                                parseIds(asset.tagIds),
                                removedTagIds
                            ),
                        ].flat()
                    )
                    await this.update(asset, {
                        tagIds: createQueryIds(assetIds),
                    })
                } else {
                    await this.update(asset, body)
                }
            } catch (err) {
                errors.push(err)
            }
        }

        return {
            errors,
        }
    }

    public async deleteByIds(ids: number[]) {
        const errors = []
        for (let i = 0; i < ids.length; i++) {
            try {
                await this.delete(ids[i])
            } catch (err) {
                errors.push(err)
            }
        }
        return {
            errors,
        }
    }

    public async update(cr: number | AssetEntity, body: IAsset) {
        const asset = isNumber(cr) ? await this.findById(cr) : cr
        await this._mergeBodyToEntity(asset, body)
        await throwValidatedErrors(asset)
        const newPic = await this.assetRepo.save(asset)
        return await this.findById(newPic.id, true)
    }

    private async _removeFiles(
        id: number,
        assetPath: string,
        assetType: AssetType
    ) {
        const name = `${id}_${assetPath}`
        const origin = path.join(config.static.assets, assetPath)
        const thumb = path.join(config.static.asset_thumbs, assetPath)

        if (assetType == AssetType.file) {
            await saveImage(getPrefix(name), config.static.bin, origin, true)
            rmSync(thumb)
            return
        }

        if (assetType == AssetType.files) {
            const target = path.join(config.static.bin, name)
            autoMkdirSync(target)
            await forEachAsync(
                sortFilenames(readDirSync(origin)),
                async (filename, index) => {
                    await saveImage(
                        `${index + 1}`,
                        target,
                        path.join(origin, filename),
                        true
                    )
                }
            )
            rmDirSync(origin)
            await forEachAsync(
                sortFilenames(readDirSync(thumb)),
                async (filename) => {
                    rmSync(path.join(thumb, filename))
                }
            )
            rmDirSync(thumb)
            return
        }
    }

    public async delete(target: number | AssetEntity) {
        const asset =
            target instanceof AssetEntity ? target : await this.findById(target)
        const id = asset.id
        if (!asset.recycle) return await this.update(id, { recycle: true })
        const result = await this.assetRepo.remove(asset)
        if (result.path)
            await this._removeFiles(id, result.path, result.assetType)
        return result
    }
}
