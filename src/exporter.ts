import { TagEntity } from 'src/tag/tag.entity'
import { CategoryEntity } from 'src/category/category.entity'
import { CharacterEntity } from 'src/character/character.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { NameEntity } from 'src/shared/name/name.entity'
import fs from 'fs-extra'
import path from 'path'
import { config } from 'src/shared/config'
import { AssetEntity } from 'src/asset/asset.entity'
import { parseIds } from './shared/utilities'

export interface ContextOptions {
    categories: CategoryEntity[]
}

function transformTagEntity(categoryId: number, tag: TagEntity) {
    return Object.assign(transformNameEntity(tag), {
        categoryId,
        order: tag.order,
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
        order: category.order,
        intro: category.intro,
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
        tags: parseIds(asset.tagIds),
        intro: asset.intro,
        assetType: asset.assetType,
        characters: parseIds(asset.characterIds),
    })
}

export function transformCharacterEntity(char: CharacterEntity) {
    return Object.assign(transformStarNameEntity(char), {
        tags: parseIds(char.tagIds),
        intro: char.intro,
        avatar: char.avatar,
        fullbody: char.fullLengthPicture,
        staticCategories: char.staticCategories,
    })
}

export function createContext(options: ContextOptions) {
    const tags: ReturnType<typeof transformTagEntity>[] = []
    const categories = options.categories
        .map((category) => transformCategoryEntity(category))
        .map((category) => {
            tags.push(...category.tags)
            return {
                id: category.id,
                name: category.name,
                type: category.type,
                order: category.order,
                intro: category.intro,
            }
        })

    return {
        tags,
        categories,
    }
}

export type Context = ReturnType<typeof createContext>

export class Exporter {
    public readonly dir: string

    constructor(dir: string) {
        this.dir = dir
        fs.ensureDirSync(this.dir)
    }

    public async outputContext(context: ContextOptions) {
        await fs.outputJson(
            path.join(this.dir, 'context.json'),
            createContext(context)
        )
    }

    public async outputCharacter(char: CharacterEntity) {
        const targetDir = path.join(this.dir, `characters/${char.id}`)
        await fs.outputJson(
            path.join(targetDir, 'character.json'),
            transformCharacterEntity(char)
        )

        if (char.avatar) {
            const src = path.join(config.static.avatars, char.avatar)
            const dest = path.join(
                targetDir,
                `avatar${path.extname(char.avatar)}`
            )
            await fs.copy(src, dest)
        }

        if (char.fullLengthPicture) {
            const src = path.join(
                config.static.fullbodys,
                char.fullLengthPicture
            )
            const dest = path.join(
                targetDir,
                `fullbody${path.extname(char.fullLengthPicture)}`
            )
            await fs.copy(src, dest)
        }
    }
}
