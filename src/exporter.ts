import { TagEntity } from 'src/tag/tag.entity'
import { CategoryEntity } from 'src/category/category.entity'
import { CharacterEntity } from 'src/character/character.entity'
import { AssetGroupEntity } from 'src/asset/group/group.entity'
import { CharacterGroupEntity } from 'src/character/group/group.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { NameEntity } from 'src/shared/name/name.entity'
import fs from 'fs-extra'
import path from 'path'
import { EventEmitter } from 'events'
import { config } from 'src/shared/config'
import { AssetEntity } from 'src/asset/asset.entity'
import { AssetType } from './interface/asset/asset.interface'
import { parseQueryIds } from './shared/utilities'

export interface ExporterOptions {
    categories: CategoryEntity[]
    assetGroups: AssetGroupEntity[]
    characterGroups: CharacterGroupEntity[]
}

function transformTagEntity(categoryId: number, tag: TagEntity) {
    return Object.assign(transformNameEntity(tag), {
        categoryId,
    })
}

function transformCategoryEntity(category: CategoryEntity) {
    return Object.assign(transformNameEntity(category), {
        type: category.type,
        tags: category.tags.map((tag) => transformTagEntity(category.id, tag)),
    })
}

function transformNameEntity<T extends NameEntity>(entity: T) {
    return {
        id: entity.id,
        name: entity.name,
    }
}

export function transformStarNameEntity<T extends StarNameEntity>(entity: T) {
    return Object.assign(transformNameEntity(entity), {
        star: entity.star,
        rating: entity.rating,
    })
}

export function transformAssetEntity(asset: AssetEntity) {
    return Object.assign(transformStarNameEntity(asset), {
        intro: asset.intro,
        remark: asset.remark,
        tags: parseQueryIds(asset.tagIds),
        groups: parseQueryIds(asset.groupIds),
        path: asset.path,
        assetType: asset.assetType,
        assetSets: asset.assetSets.map((assetSet) => assetSet.id),
        characters: parseQueryIds(asset.characterIds),
    })
}

export function transformCharacterEntity(char: CharacterEntity) {
    return Object.assign(transformStarNameEntity(char), {
        intro: char.intro,
        remark: char.remark,
        avatar: char.avatar,
        fullLengthPicture: char.fullLengthPicture,
        tags: parseQueryIds(char.tagIds),
        groups: parseQueryIds(char.groupIds),
        assetSets: char.assetSets.map((assetSet) => assetSet.id),
    })
}

export function createContext(options: ExporterOptions) {
    return {
        categories: options.categories.map((category) =>
            transformCategoryEntity(category)
        ),
        assetGroups: options.assetGroups.map((assetGroup) =>
            transformStarNameEntity(assetGroup)
        ),
        characterGroups: options.characterGroups.map((charGroup) =>
            transformStarNameEntity(charGroup)
        ),
    }
}

export class Exporter extends EventEmitter {
    public readonly dir: string
    public readonly context: ReturnType<typeof createContext>
    public readonly exportAssets: boolean

    constructor(dir: string, options: ExporterOptions, exportAssets = false) {
        super()

        this.dir = dir
        this.context = createContext(options)
        this.exportAssets = exportAssets

        fs.ensureDirSync(this.dir)
    }

    public async outputContext() {
        this.emit('message', 'export context: start')
        await fs.outputJson(path.join(this.dir, 'context.json'), this.context)
        this.emit('message', 'export context: end')
    }

    public async outputAsset(asset: AssetEntity) {
        const infoHeader = `export asset ${asset.id}: `
        this.emit('message', infoHeader + 'start')
        const targetDir = path.join(this.dir, `assets`)
        await fs.outputJson(
            path.join(targetDir, `${asset.id}.json`),
            transformAssetEntity(asset)
        )

        if (asset.path && this.exportAssets) {
            if (asset.assetType === AssetType.file)
                this.emit('message', infoHeader + 'file')
            if (asset.assetType === AssetType.folder)
                this.emit('message', infoHeader + 'folder')
            const src = path.join(config.ASSETS_PATH, asset.path)
            const dest = path.join(targetDir, `${asset.path}`)
            await fs.copyFile(src, dest)
        }

        this.emit('message', infoHeader + 'end')
    }

    /**
     * output character entity
     * @param char that includes all relations without assets
     */
    public async outputCharacter(char: CharacterEntity) {
        const infoHeader = `export character ${char.id}(${char.name}): `
        this.emit('message', infoHeader + 'start')
        const targetDir = path.join(this.dir, `characters/${char.id}`)
        await fs.outputJson(
            path.join(targetDir, 'character.json'),
            transformCharacterEntity(char)
        )

        if (char.avatar && this.exportAssets) {
            this.emit('message', infoHeader + 'avatar')
            const src = path.join(config.AVATARS_PATH, char.avatar)
            const dest = path.join(
                targetDir,
                `avatar${path.extname(char.avatar)}`
            )
            await fs.copy(src, dest)
        }

        if (char.fullLengthPicture && this.exportAssets) {
            this.emit('message', infoHeader + 'full-length picture')
            const src = path.join(
                config.FULL_LENGTH_PICTURES_PATH,
                char.fullLengthPicture
            )
            const dest = path.join(
                targetDir,
                `fullLengthPicture${path.extname(char.fullLengthPicture)}`
            )
            await fs.copy(src, dest)
        }

        this.emit('message', infoHeader + 'end')
    }
}
