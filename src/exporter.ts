import { TagEntity } from 'src/tag/tag.entity'
import { CategoryEntity } from 'src/category/category.entity'
import { CharacterEntity } from 'src/character/character.entity'
import { AssetGroupEntity } from 'src/asset/group/group.entity'
import { CharacterGroupEntity } from 'src/group/group.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { NameEntity } from 'src/shared/name/name.entity'
import fs from 'fs-extra'
import path from 'path'
import { config } from 'src/shared/config'
import { AssetEntity } from 'src/asset/asset.entity'
import { parseIds } from './shared/utilities'
import { StaticCategoryEntity } from './staticCategory/staticCategory.entity'
import { RelationshipEntity } from './relationship/relationship.entity'

export interface ContextOptions {
    categories: CategoryEntity[]
    assetGroups: AssetGroupEntity[]
    relationships: RelationshipEntity[]
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

export function transformRelationshipEntity(relationship: RelationshipEntity) {
    return Object.assign(transformNameEntity(relationship), {
        selfName: relationship.selfName,
        targetName: relationship.targetName,
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
                intro: category.intro,
            }
        })

    return {
        tags,
        categories,
        assetGroups: options.assetGroups.map((assetGroup) =>
            transformStarNameEntity(assetGroup)
        ),
        relationships: options.relationships.map((relationship) =>
            transformRelationshipEntity(relationship)
        ),
        characterGroups: options.characterGroups.map((charGroup) =>
            transformStarNameEntity(charGroup)
        ),
        staticCategories: options.staticCategories.map((category) =>
            transformStaticCategoryEntity(category)
        ),
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

    public async outputAsset(asset: AssetEntity) {
        const targetDir = path.join(this.dir, `assets`)

        if (asset.path) {
            const src = path.join(config.ASSETS_PATH, asset.path)
            asset.path = `${asset.id}${path.extname(asset.path)}`
            const dest = path.join(targetDir, asset.path)

            await fs.copy(src, dest)
        }

        await fs.outputJson(
            path.join(targetDir, `${asset.id}.json`),
            transformAssetEntity(asset)
        )
    }

    /**
     * output character entity
     * @param char that includes all relations without assets
     */
    public async outputCharacter(char: CharacterEntity) {
        const targetDir = path.join(this.dir, `characters/${char.id}`)
        await fs.outputJson(
            path.join(targetDir, 'character.json'),
            transformCharacterEntity(char)
        )

        if (char.avatar) {
            const src = path.join(config.AVATARS_PATH, char.avatar)
            const dest = path.join(
                targetDir,
                `avatar${path.extname(char.avatar)}`
            )
            await fs.copy(src, dest)
        }

        if (char.fullLengthPicture) {
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
    }
}
