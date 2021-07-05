import { EventEmitter } from 'events'
import fs from 'fs-extra'
import path from 'path'
import {
    createContext,
    transformAssetEntity,
    transformCharacterEntity,
    transformStarNameEntity,
} from 'src/exporter'
import { IAsset } from './interface/asset/asset.interface'
import { ICharacter } from './interface/character/character.interface'
import { config } from './shared/config'
import { v4 as uuidv4 } from 'uuid'
import { ICategory } from './interface/category.interface'
import { IStarName } from './interface/name.interface'
import { ITag } from './interface/tag.interface'

export class Importer extends EventEmitter {
    public readonly dir: string

    constructor(dir: string) {
        super()
        this.dir = dir

        this.checkPathExists(dir)
    }

    public checkPathExists(path: string) {
        if (!fs.pathExistsSync(path)) throw ''
    }

    public async inputContext(): Promise<{
        tags: Required<ITag>[]
        categories: Required<ICategory>[]
        assetGroups: Required<IStarName>[]
        characterGroups: Required<IStarName>[]
    }> {
        this.emit('message', 'import context: start')
        const filename = path.join(this.dir, 'context.json')
        this.checkPathExists(filename)
        const result: ReturnType<typeof createContext> = await fs.readJson(
            filename
        )
        const tags: Required<ITag>[] = []
        const categories: Required<ICategory>[] = result.categories.map(
            (category) => {
                tags.concat(
                    category.tags.map((tag) => ({
                        name: tag.name,
                        categoryId: tag.categoryId,
                    }))
                )
                return {
                    name: category.name,
                    type: String(category.type),
                }
            }
        )

        this.emit('message', 'import context: end')

        return {
            tags,
            categories,
            assetGroups: result.assetGroups,
            characterGroups: result.characterGroups,
        }
    }

    private _inputStarName(d: ReturnType<typeof transformStarNameEntity>) {
        return {
            name: d.name,
            star: d.star,
            rating: d.rating,
        }
    }

    public async inputAsset(id: number): Promise<IAsset> {
        const infoHeader = `import asset ${id}: `
        this.emit('message', infoHeader + 'start')

        const filename = path.join(this.dir, `assets/${id}.json`)
        this.checkPathExists(filename)
        const asset: ReturnType<
            typeof transformAssetEntity
        > = await fs.readJson(filename)

        this.emit('message', infoHeader + 'content')
        const pathUUID = uuidv4()
        if (await fs.pathExists(asset.path))
            await fs.copy(asset.path, path.join(config.TEMP_PATH, pathUUID))

        this.emit('message', infoHeader + 'end')

        return Object.assign(this._inputStarName(asset), {
            intro: asset.intro,
            remark: asset.remark,
            tagIds: asset.tags.join(),
            groupIds: asset.tags.join(),
            assetType: asset.assetType,
            assetSetIds: asset.assetSets.join(),
            characterIds: asset.characters.join(),
        })
    }

    public async *assetGenerator() {
        let i = 0
        const ids = (await fs.readdir(path.join(this.dir, 'assets'))).filter(
            (base) => path.extname(base) === '.json'
        )
        while (i < ids.length) {
            const id = ids[i]
            i++

            try {
                yield await this.inputAsset(parseInt(id))
            } catch (err) {
                this.emit('error', err)
            }
        }
    }

    public async inputCharacter(id: number): Promise<ICharacter> {
        const infoHeader = `import character ${id}: `
        this.emit('message', infoHeader + 'start')

        const root = path.join(this.dir, `characters/${id}`)
        const filename = path.join(root, 'character.json')
        this.checkPathExists(filename)
        const char: ReturnType<
            typeof transformCharacterEntity
        > = await fs.readJson(filename)

        this.emit('message', infoHeader + 'avatar')
        const avatarFilename = path.join(root, 'avatar.png')
        const avatarUUID = uuidv4()
        if (await fs.pathExists(avatarFilename))
            await fs.copy(
                avatarFilename,
                path.join(config.TEMP_PATH, `${avatarUUID}.png`)
            )

        this.emit('message', infoHeader + 'full-length picture')
        const flpicFilename = path.join(root, 'fullLengthPicture.png')
        const flpicUUID = uuidv4()
        if (await fs.pathExists(flpicFilename))
            await fs.copy(
                avatarFilename,
                path.join(config.TEMP_PATH, `${flpicUUID}.png`)
            )

        this.emit('message', infoHeader + 'end')

        return Object.assign(this._inputStarName(char), {
            intro: char.intro,
            avatar: avatarUUID,
            remark: char.remark,
            tagIds: char.tags.join(),
            groupIds: char.tags.join(),
            assetSetIds: char.assetSets.join(),
            fullLengthPicture: flpicUUID,
        })
    }

    public async *characterGenerator() {
        let i = 0
        const ids = (
            await fs.readdir(path.join(this.dir, 'characters'))
        ).filter((base) => path.extname(base) === '')
        while (i < ids.length) {
            const id = ids[i]
            i++

            try {
                yield await this.inputCharacter(parseInt(id))
            } catch (err) {
                this.emit('error', err)
            }
        }
    }
}
