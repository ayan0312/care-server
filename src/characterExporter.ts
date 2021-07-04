import { TagEntity } from 'src/tag/tag.entity'
import { CategoryEntity } from 'src/category/category.entity'
import { CharacterEntity } from 'src/character/character.entity'
import { AssetGroupEntity } from 'src/asset/group/group.entity'
import { CharacterGroupEntity } from 'src/character/group/group.entity'
import { StarNameEntity } from './shared/name/starName.entity'
import { NameEntity } from './shared/name/name.entity'

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

function transformCharacterEntityWithoutRelations(char: CharacterEntity) {
    return Object.assign(transformStarNameEntity(char), {
        intro: char.intro,
        remark: char.remark,
        tagIds: char.tagIds,
    })
}

function createContext(options: ExporterOptions) {
    return {
        categories: options.categories.map((category) =>
            transformCategoryEntity(category)
        ),
        assetGroups: options.assetGroups.map((picGroup) =>
            transformStarNameEntity(picGroup)
        ),
        characterGroups: options.characterGroups.map((charGroup) =>
            transformStarNameEntity(charGroup)
        ),
    }
}

export class CharacterExporter {
    public context: ReturnType<typeof createContext>

    constructor(options: ExporterOptions) {
        this.context = createContext(options)
    }

    public createCharacterStream(charWithRelations: CharacterEntity) {
        const charWithoutRelations = transformCharacterEntityWithoutRelations(
            charWithRelations
        )
    }
}
