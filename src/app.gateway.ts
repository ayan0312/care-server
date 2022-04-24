import {
    OnGatewayConnection,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayDisconnect,
    WebSocketServer,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { DefaultValuePipe, Logger } from '@nestjs/common'
import { Context, Exporter } from './exporter'
import { config } from './shared/config'
import { AssetService } from './asset/asset.service'
import { AssetGroupService } from './asset/group/group.service'
import { CategoryService } from './category/category.service'
import { CharacterService } from './character/character.service'
import { CharacterGroupService } from './group/group.service'
import { StaticCategoryService } from './staticCategory/staticCategory.service'
import { TagService } from './tag/tag.service'
import { Importer } from './importer'
import { RelationshipService } from './relationship/relationship.service'
import { forEachAsync } from './shared/utilities'

function createTitle(id: number, name?: string) {
    return `${id}${name ? `(${name})` : ''}`
}

@WebSocketGateway({
    path: '/data',
    allowEIO3: true,
    cors: {
        origin: /.*/,
        credentials: true,
    },
})
export class AppGateway {
    constructor(
        private readonly tagService: TagService,
        private readonly assetService: AssetService,
        private readonly categoryService: CategoryService,
        private readonly characterService: CharacterService,
        private readonly assetGroupService: AssetGroupService,
        private readonly relationshipService: RelationshipService,
        private readonly staticCategoryService: StaticCategoryService,
        private readonly characterGroupService: CharacterGroupService
    ) {}
    private logger: Logger = new Logger('AppGateway')

    public afterInit() {
        this.logger.log('websocket init...')
    }

    private async _exportContext(exporter: Exporter, client: Socket) {
        const categories = await this.categoryService.findRelations()
        const assetGroups = await this.assetGroupService.findAll()
        const relationships = await this.relationshipService.findAll()
        const characterGroups = await this.characterGroupService.findAll()
        const staticCategories = await this.staticCategoryService.findAll()

        client.emit('export', `export context: start`)
        await exporter.outputContext({
            categories,
            assetGroups,
            relationships,
            characterGroups,
            staticCategories,
        })
        client.emit('export', `export context: finished`)
    }

    private async _exportCharacter(exporter: Exporter, client: Socket) {
        for await (let { data } of this.characterService.generator([
            'assetSets',
        ])) {
            client.emit(
                'export',
                `export character ${createTitle(data.id, data.name)}: start`
            )
            try {
                await exporter.outputCharacter(data)
            } catch (err) {
                client.emit('export_error', err)
            }
            client.emit(
                'export',
                `export character ${createTitle(data.id, data.name)}: finished`
            )
        }
    }

    private async _exportAsset(exporter: Exporter, client: Socket) {
        for await (let { data } of this.assetService.generator(['assetSets'])) {
            client.emit(
                'export',
                `export asset ${createTitle(data.id, data.name)}: start`
            )
            try {
                await exporter.outputAsset(data)
            } catch (err) {
                client.emit('export_error', err)
            }
            client.emit(
                'export',
                `export asset ${createTitle(data.id, data.name)}: finished`
            )
        }
    }

    @SubscribeMessage('export')
    public async handleExport(
        @MessageBody(new DefaultValuePipe('')) path: string,
        @ConnectedSocket() client: Socket
    ) {
        const exporter = new Exporter(path || config.EXPORT_DIR)
        await this._exportContext(exporter, client)
        await this._exportCharacter(exporter, client)
        await this._exportAsset(exporter, client)
        client.emit('export', 'finished')
        client.disconnect()
    }

    private async _importCategories(
        categories: Context['categories'],
        importer: Importer,
        client: Socket
    ) {
        client.emit('import', 'import categories: start')
        await forEachAsync(categories, async (category) => {
            const result = await this.categoryService.create(category)
            importer.setId('category', category.id, result.id)
        })
        client.emit('import', 'import categories: finished')
    }

    private async _importTags(
        tags: Context['tags'],
        importer: Importer,
        client: Socket
    ) {
        client.emit('import', 'import tags: start')
        await forEachAsync(tags, async (tag) => {
            tag.categoryId = importer.getId('category', tag.categoryId)
            const result = await this.tagService.create(tag)
            importer.setId('tag', tag.id, result.id)
        })
        client.emit('import', 'import tags: finished')
    }

    private async _importAssetGroups(
        assetGroups: Context['assetGroups'],
        importer: Importer,
        client: Socket
    ) {
        client.emit('import', 'import asset groups: start')
        await forEachAsync(assetGroups, async (assetGroup) => {
            const result = await this.assetGroupService.create(assetGroup)
            importer.setId('assetGroup', assetGroup.id, result.id)
        })
        client.emit('import', 'import asset groups: finished')
    }

    private async _importRelationships(
        relationships: Context['relationships'],
        importer: Importer,
        client: Socket
    ) {
        client.emit('import', 'import relationships: start')
        await forEachAsync(relationships, async (relationship) => {
            const result = await this.relationshipService.create(relationship)
            importer.setId('relationship', relationship.id, result.id)
        })
        client.emit('import', 'import relationships: finished')
    }

    private async _importCharacterGroups(
        characterGroups: Context['characterGroups'],
        importer: Importer,
        client: Socket
    ) {
        client.emit('import', 'import character groups: start')
        await forEachAsync(characterGroups, async (characterGroup) => {
            const result = await this.characterGroupService.create(
                characterGroup
            )
            importer.setId('characterGroup', characterGroup.id, result.id)
        })
        client.emit('import', 'import character groups: finished')
    }

    private async _importStaticCategories(
        staticCategories: Context['staticCategories'],
        importer: Importer,
        client: Socket
    ) {
        client.emit('import', 'import static categories: start')
        await forEachAsync(staticCategories, async (staticCategory) => {
            const result = await this.staticCategoryService.create(
                staticCategory
            )
            importer.setId('staticCategory', staticCategory.id, result.id)
        })
        client.emit('import', 'import static categories: finished')
    }

    private async _importContext(importer: Importer, client: Socket) {
        client.emit('import', 'import context: start')
        const context = await importer.inputContext()
        await this._importCategories(context.categories, importer, client)
        await this._importTags(context.tags, importer, client)
        await this._importAssetGroups(context.assetGroups, importer, client)
        await this._importRelationships(context.relationships, importer, client)
        await this._importCharacterGroups(
            context.characterGroups,
            importer,
            client
        )
        await this._importStaticCategories(
            context.staticCategories,
            importer,
            client
        )
        client.emit('import', 'import context: finished')
    }

    private async _importCharacter(importer: Importer, client: Socket) {
        for await (let char of importer.characterGenerator()) {
            client.emit(
                'import',
                `import character ${createTitle(char.id, char.name)}: start`
            )
            const result = await this.characterService.create(char)
            importer.setId('character', char.id, result.id)
            client.emit(
                'import',
                `import character ${createTitle(char.id, char.name)}: finished`
            )
        }
    }

    private async _importAsset(importer: Importer, client: Socket) {
        for await (let asset of importer.assetGenerator()) {
            client.emit(
                'import',
                `import asset ${createTitle(asset.id, asset.name)}: start`
            )
            const result = await this.assetService.create(asset)
            importer.setId('asset', asset.id, result.id)
            client.emit(
                'import',
                `import asset ${createTitle(asset.id, asset.name)}: finished`
            )
        }
    }

    @SubscribeMessage('import')
    public async handleImport(
        @MessageBody(new DefaultValuePipe('')) path: string,
        @ConnectedSocket() client: Socket
    ) {
        const importer = new Importer(path || config.IMPORT_DIR)

        try {
            await this._importContext(importer, client)
            await this._importCharacter(importer, client)
            await this._importAsset(importer, client)
        } catch (err) {
            client.emit('import_error', err)
        }
        client.emit('import', 'finished')
    }
}
