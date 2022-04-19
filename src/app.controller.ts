import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssetService } from './asset/asset.service'
import { AssetGroupService } from './asset/group/group.service'
import { CharacterGroupService } from './character/group/group.service'
import { CategoryService } from './category/category.service'
import { CharacterService } from './character/character.service'
import { Exporter } from './exporter'
import { TagService } from './tag/tag.service'

import { Importer } from './importer'
import { CategoryType } from './interface/category.interface'
import { StaticCategoryService } from './staticCategory/staticCategory.service'

@ApiTags('root')
@Controller()
export class AppController {
    constructor(
        private readonly tagService: TagService,
        private readonly charService: CharacterService,
        private readonly assetService: AssetService,
        private readonly categoryService: CategoryService,
        private readonly charGroupService: CharacterGroupService,
        private readonly assetGroupService: AssetGroupService,
        private readonly staticCategoryService: StaticCategoryService
    ) {}

    @Get()
    public getApi() {
        return '<h1>care server</h1>'
    }

    @Post('data')
    public async importData(
        @Body('path') path?: string,
        @Body('file') file = false
    ) {
        if (!path) return

        const importer = new Importer(path, file)

        importer.on('message', (msg) => {
            console.log(msg)
        })

        const {
            tags,
            categories,
            assetGroups,
            characterGroups,
            staticCategories,
        } = await importer.inputContext()

        try {
            for (let i = 0; i < categories.length; i++)
                importer.setId(
                    'category',
                    categories[i].id,
                    (
                        await this.categoryService.create(
                            categories[i].name,
                            categories[i].type
                        )
                    ).id
                )

            for (let i = 0; i < tags.length; i++) {
                tags[i].categoryId = importer.getId(
                    'category',
                    tags[i].categoryId
                )
                importer.setId(
                    'tag',
                    tags[i].id,
                    (await this.tagService.create(tags[i])).id
                )
            }

            for (let i = 0; i < assetGroups.length; i++)
                importer.setId(
                    'assetGroup',
                    assetGroups[i].id,
                    (await this.assetGroupService.create(assetGroups[i])).id
                )

            for (let i = 0; i < characterGroups.length; i++)
                importer.setId(
                    'characterGroup',
                    characterGroups[i].id,
                    (await this.charGroupService.create(characterGroups[i])).id
                )

            for (let i = 0; i < staticCategories.length; i++)
                importer.setId(
                    'staticCategory',
                    staticCategories[i].id,
                    (
                        await this.staticCategoryService.create(
                            staticCategories[i]
                        )
                    ).id
                )

            for await (let char of importer.characterGenerator()) {
                importer.setId(
                    'character',
                    char.id,
                    (file
                        ? await this.charService.create(char)
                        : await this.charService.save(char)
                    ).id
                )
            }

            for await (let asset of importer.assetGenerator()) {
                importer.setId(
                    'asset',
                    asset.id,
                    (file
                        ? await this.assetService.create(asset)
                        : await this.assetService.save(asset)
                    ).id
                )
            }
        } catch (err) {
            console.error(err)
        }

        console.log('import end')
    }

    @Get('data')
    public async exportData(
        @Body('path') path?: string,
        @Body('file') file = false
    ) {
        if (!path) return

        const categories = await this.categoryService.findRelations()
        const assetGroups = await this.assetGroupService.findAll()
        const characterGroups = await this.charGroupService.findAll()
        const staticCategories = await this.staticCategoryService.findAll()

        const exporter = new Exporter(
            path,
            {
                categories,
                assetGroups,
                characterGroups,
                staticCategories,
            },
            file
        )

        exporter.on('message', (msg) => {
            console.log(msg)
        })

        try {
            await exporter.outputContext()

            for await (let char of this.charService.generator(['assetSets']))
                await exporter.outputCharacter(char.data)

            for await (let asset of this.assetService.generator(['assetSets']))
                await exporter.outputAsset(asset.data)
        } catch (err) {
            console.log(err)
        }

        console.log('export end')
    }
}
