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
import { AssetEntity, AssetType } from 'src/asset/asset.entity'

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

function transformStarNameEntity<T extends StarNameEntity>(entity: T) {
    return Object.assign(transformNameEntity(entity), {
        star: entity.star,
        rating: entity.rating,
    })
}

function transformAssetEntity(asset: AssetEntity) {
    return Object.assign(transformStarNameEntity(asset), {
        intro: asset.intro,
        remark: asset.remark,
        tags: asset.tags.map((tag) => tag.id),
        groups: asset.groups.map((group) => group.id),
        assetType: asset.assetType,
        assetSets: asset.assetSets.map((assetSet) => assetSet.id),
        characters: asset.characters.map((char) => char.id),
    })
}

function transformCharacterEntity(char: CharacterEntity) {
    return Object.assign(transformStarNameEntity(char), {
        intro: char.intro,
        remark: char.remark,
        tags: char.tags.map((tag) => tag.id),
        groups: char.groups.map((group) => group.id),
        assetSets: char.assetSets.map((assetSet) => assetSet.id),
    })
}

function createContext(options: ExporterOptions) {
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

    constructor(dir: string, options: ExporterOptions) {
        super()
        this.dir = dir
        this.context = createContext(options)

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
        const targetDir = path.resolve(this.dir, `assets`)
        await fs.outputJson(
            path.resolve(targetDir, `${asset.id}.json`),
            transformAssetEntity(asset)
        )

        if (asset.path) {
            if (asset.assetType === AssetType.file)
                this.emit('message', infoHeader + 'file')
            if (asset.assetType === AssetType.folder)
                this.emit('message', infoHeader + 'folder')
            const src = path.resolve(config.ASSETS_PATH, asset.path)
            const dest = path.resolve(
                targetDir,
                `${asset.id}${path.extname(asset.path)}`
            )
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
        const targetDir = path.resolve(this.dir, `characters/${char.id}`)
        await fs.outputJson(
            path.resolve(targetDir, 'character.json'),
            transformCharacterEntity(char)
        )

        if (char.avatar) {
            this.emit('message', infoHeader + 'avatar')
            const src = path.resolve(config.AVATARS_PATH, char.avatar)
            const dest = path.resolve(
                targetDir,
                `avatar.${path.extname(char.avatar)}`
            )
            await fs.copy(src, dest)
        }

        if (char.fullLengthPicture) {
            this.emit('message', infoHeader + 'full-length picture')
            const src = path.resolve(
                config.FULL_LENGTH_PICTURES_PATH,
                char.fullLengthPicture
            )
            const dest = path.resolve(
                targetDir,
                `fullLengthPicture.${path.extname(char.fullLengthPicture)}`
            )
            await fs.copy(src, dest)
        }

        this.emit('message', infoHeader + 'end')
    }
}
