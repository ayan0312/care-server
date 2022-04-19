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
import { parseIds } from './shared/utilities'
import { StaticCategoryEntity } from './staticCategory/staticCategory.entity'

export interface ExporterOptions {
    categories: CategoryEntity[]
    assetGroups: AssetGroupEntity[]
    characterGroups: CharacterGroupEntity[]
    staticCategories: StaticCategoryEntity[]
}

function transformTagEntity(categoryId: number, tag: TagEntity) {
    return Object.assign(transformNameEntity(tag), {
        categoryId,
    })
}

function transformNameEntity<T extends NameEntity>(entity: T) {
    return {
        id: entity.id,
        name: entity.name,
    }
}

function transformCategoryEntity(category: CategoryEntity) {
    return Object.assign(transformNameEntity(category), {
        tags: category.tags.map((tag) => transformTagEntity(category.id, tag)),
        type: category.type,
        intro: category.intro,
    })
}

function transformStaticCategoryEntity(category: StaticCategoryEntity) {
    return Object.assign(transformNameEntity(category), {
        intro: category.intro,
        script: category.script,
    })
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
        tags: parseIds(asset.tagIds),
        groups: parseIds(asset.groupIds),
        path: asset.path,
        assetType: asset.assetType,
        assetSets: asset.assetSets.map((assetSet) => assetSet.id),
        characters: parseIds(asset.characterIds),
    })
}

export function transformCharacterEntity(char: CharacterEntity) {
    return Object.assign(transformStarNameEntity(char), {
        intro: char.intro,
        remark: char.remark,
        avatar: char.avatar,
        fullLengthPicture: char.fullLengthPicture,
        tags: parseIds(char.tagIds),
        groups: parseIds(char.groupIds),
        assetSets: char.assetSets.map((assetSet) => assetSet.id),
        staticCategories: char.staticCategories,
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
        staticCategories: options.staticCategories.map((category) =>
            transformStaticCategoryEntity(category)
        ),
    }
}

export class Exporter extends EventEmitter {
    public readonly dir: string
    public readonly context: ReturnType<typeof createContext>
    public readonly exportAssets: boolean

    constructor(dir: string, options: ExporterOptions, exportAssets: boolean) {
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

        if (asset.path && this.exportAssets) {
            if (asset.assetType === AssetType.file)
                this.emit('message', infoHeader + 'file')
            if (asset.assetType === AssetType.folder)
                this.emit('message', infoHeader + 'folder')
            const src = path.join(config.ASSETS_PATH, asset.path)
            asset.path = `${asset.id}${path.extname(asset.path)}`
            const dest = path.join(targetDir, asset.path)

            await fs.copy(src, dest)
        }

        await fs.outputJson(
            path.join(targetDir, `${asset.id}.json`),
            transformAssetEntity(asset)
        )

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
