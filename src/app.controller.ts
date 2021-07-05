import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    Post,
    Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssetService } from './asset/asset.service'
import { GroupService as AssetGroupService } from './asset/group/group.service'
import { GroupService as CharacterGroupService } from './character/group/group.service'
import { CategoryService } from './category/category.service'
import { CharacterService } from './character/character.service'
import { Exporter } from './exporter'
import { ISettings } from './interface/settings.interface'
import { TagService } from './tag/tag.service'

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
    ) { }

    @Get()
    public getApi() {
        return '<h1>care server</h1>'
    }

    @Get('settings')
    public async exportSettings(
        @Query('path', new DefaultValuePipe('')) path: string
    ) {
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

        await exporter.outputContext()

        for await (let char of this.charService.generator())
            await exporter.outputCharacter(char.data)

        for await (let asset of this.assetService.generator())
            await exporter.outputAsset(asset.data)
    }

    @Post('settings')
    public async importSettings(@Body() settings: ISettings) {
        if (settings.categories && settings.categories.length > 0) {
            for (let i in settings.categories) {
                const { name, type, tags } = settings.categories[i]
                const category = await this.categoryService.create(name, type)
                for (let j in tags) {
                    this.tagService.create({
                        name: tags[j],
                        categoryId: category.id,
                    })
                }
            }
        }
    }
}
