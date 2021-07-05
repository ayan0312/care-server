import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssetService } from './asset/asset.service'
import { AssetGroupService } from './asset/group/group.service'
import { CharacterGroupService } from './character/group/group.service'
import { CategoryService } from './category/category.service'
import { CharacterService } from './character/character.service'
import { Exporter } from './exporter'
import { ISettings } from './interface/settings.interface'
import { TagService } from './tag/tag.service'

import fs from 'fs-extra'
import { Importer } from './importer'

@ApiTags('root')
@Controller()
export class AppController {
    constructor(
        private readonly tagService: TagService,
        private readonly charService: CharacterService,
        private readonly assetService: AssetService,
        private readonly categoryService: CategoryService,
        private readonly charGroupService: CharacterGroupService,
        private readonly assetGroupService: AssetGroupService
    ) {}

    @Get()
    public getApi() {
        return '<h1>care server</h1>'
    }

    @Post('data')
    public async importData(@Body('path') path?: string) {
        if (!path) return

        const importer = new Importer(path)

        importer.on('message', (msg) => {
            console.log(msg)
        })

        const {
            tags,
            categories,
            assetGroups,
            characterGroups,
        } = await importer.inputContext()

        try {
            for (let i = 0; i < categories.length; i++)
                await this.categoryService.create(
                    categories[i].name,
                    Number(categories[i].type)
                )

            for (let i = 0; i < tags.length; i++)
                await this.tagService.create(tags[i])

            for (let i = 0; i < assetGroups.length; i++)
                await this.assetGroupService.create(assetGroups[i])

            for (let i = 0; i < characterGroups.length; i++)
                await this.charGroupService.create(characterGroups[i])

            for await (let char of importer.characterGenerator())
                await this.charService.create(char)

            for await (let asset of importer.assetGenerator())
                await this.assetService.create(asset)
        } catch (err) {
            console.error(err)
        }
    }

    @Get('data')
    public async exportData(@Body('path') path?: string) {
        if (!path) return

        const categories = await this.categoryService.findRelations()
        const assetGroups = await this.assetGroupService.findAll()
        const characterGroups = await this.charGroupService.findAll()

        const exporter = new Exporter(path, {
            categories,
            assetGroups,
            characterGroups,
        })

        exporter.on('message', (msg) => {
            console.log(msg)
        })

        try {
            await exporter.outputContext()

            for await (let char of this.charService.generator([
                'tags',
                'groups',
                'assetSets',
            ]))
                await exporter.outputCharacter(char.data)

            for await (let asset of this.assetService.generator([
                'tags',
                'groups',
                'assetSets',
                'characters',
            ]))
                await exporter.outputAsset(asset.data)
        } catch (err) {
            console.log(err)
        }
    }
}
