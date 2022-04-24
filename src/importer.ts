import { EventEmitter } from 'events'
import fs from 'fs-extra'
import path from 'path'
import {
    Context,
    transformAssetEntity,
    transformCharacterEntity,
    transformStarNameEntity,
} from 'src/exporter'
import { config } from './shared/config'
import { v4 as uuidv4 } from 'uuid'
import { AssetType } from './interface/asset/asset.interface'

type EntityKey =
    | 'tag'
    | 'asset'
    | 'category'
    | 'character'
    | 'assetGroup'
    | 'relationship'
    | 'characterGroup'
    | 'staticCategory'

export class Importer extends EventEmitter {
    public readonly dir: string

    constructor(dir: string) {
        super()
        this.dir = dir
        this.checkPathExists(dir)
    }

    public checkPathExists(path: string) {
        if (!fs.pathExistsSync(path)) throw 'not found context.json'
    }

    public async inputContext() {
        this.emit('message', 'import context: start')
        const filename = path.join(this.dir, 'context.json')
        this.checkPathExists(filename)
        const result: Context = await fs.readJson(filename)
        this.emit('message', 'import context: finished')
        return result
    }

    private _inputStarName(d: ReturnType<typeof transformStarNameEntity>) {
        return {
            id: d.id,
            name: d.name,
            star: d.star,
            rating: d.rating,
        }
    }

    public convertIds(type: EntityKey, ids: number[]) {
        return ids.map((id) => this.getId(type, id)).join()
    }

    public convertIdMap(type: EntityKey, idMap: Record<number, any>) {
        const map: Record<number, any> = {}
        Object.keys(idMap).forEach((key) => {
            const id = Number(key)
            map[this.getId(type, id)] = idMap[id]
        })
        return map
    }

    public async inputAsset(id: number) {
        const infoHeader = `import asset ${id}: `
        this.emit('message', infoHeader + 'start')

        const root = path.join(this.dir, 'assets')
        const filename = path.join(root, `${id}.json`)

        this.checkPathExists(filename)

        const asset: ReturnType<
            typeof transformAssetEntity
        > = await fs.readJson(filename)

        this.emit('message', infoHeader + 'content')
        const pathUUID = await this.copyAsset(path.join(root, asset.path))

        this.emit('message', infoHeader + 'finished')

        return Object.assign(this._inputStarName(asset), {
            path: pathUUID,
            intro: asset.intro,
            remark: asset.remark,
            tagIds: this.convertIds('tag', asset.tags),
            groupIds: this.convertIds('assetGroup', asset.groups),
            assetType: asset.assetType || AssetType.file,
            assetSetIds: asset.assetSets.join(),
            characterIds: this.convertIds('character', asset.characters),
        })
    }

    public async *assetGenerator() {
        let i = 0
        const ids = (await fs.readdir(path.join(this.dir, 'assets')))
            .filter((base) => path.extname(base) === '.json')
            .map((json) => parseInt(json.split('.json')[0]))
            .sort((a, b) => a - b)

        while (i < ids.length) {
            const id = ids[i]
            i++

            try {
                yield await this.inputAsset(id)
            } catch (err) {
                this.emit('error', err)
            }
        }
    }

    public async copyAsset(filename: string) {
        if (!(await fs.pathExists(filename))) return ''

        const name = `${uuidv4()}${path.extname(filename)}`
        await fs.copy(filename, path.join(config.TEMP_PATH, name))
        return name
    }

    public async inputCharacter(id: number) {
        const infoHeader = `import character ${id}: `
        this.emit('message', infoHeader + 'start')

        const root = path.join(this.dir, `characters/${id}`)
        const charJsonFilename = path.join(root, 'character.json')

        this.checkPathExists(charJsonFilename)

        const char: ReturnType<
            typeof transformCharacterEntity
        > = await fs.readJson(charJsonFilename)

        this.emit('message', infoHeader + 'avatar')
        const avatarUUID = await this.copyAsset(path.join(root, 'avatar.png'))

        this.emit('message', infoHeader + 'full-length picture')
        const flpicUUID = await this.copyAsset(
            path.join(root, 'fullLengthPicture.png')
        )

        this.emit('message', infoHeader + 'finished')

        return Object.assign(this._inputStarName(char), {
            intro: char.intro,
            avatar: avatarUUID,
            remark: char.remark,
            tagIds: this.convertIds('tag', char.tags),
            groupIds: this.convertIds('characterGroup', char.groups),
            assetSetIds: char.assetSets.join(),
            fullLengthPicture: flpicUUID,
            staticCategories: this.convertIdMap(
                'staticCategory',
                char.staticCategories
            ),
        })
    }

    private _idMap: Record<EntityKey, Record<number, number>> = {
        tag: {},
        asset: {},
        category: {},
        character: {},
        assetGroup: {},
        relationship: {},
        characterGroup: {},
        staticCategory: {},
    }

    public setId(key: EntityKey, oldId: number, newId: number) {
        this._idMap[key][oldId] = newId
    }

    public getId(key: EntityKey, oldId: number) {
        return this._idMap[key][oldId]
    }

    public async *characterGenerator() {
        let i = 0
        const ids = (await fs.readdir(path.join(this.dir, 'characters')))
            .filter((base) => path.extname(base) === '')
            .sort((a, b) => parseInt(a) - parseInt(b))

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
