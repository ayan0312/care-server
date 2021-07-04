import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    Post,
    Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CategoryService } from './category/category.service'
import { CharacterService } from './character/character.service'
import { ISettings } from './interface/settings.interface'
import { TagService } from './tag/tag.service'

@ApiTags('root')
@Controller()
export class AppController {
    constructor(
        private readonly tagService: TagService,
        private readonly charService: CharacterService,
        private readonly categoryService: CategoryService
    ) {}

    @Get()
    public getApi() {
        return '<h1>care server</h1>'
    }

    @Get('settings')
    public async exportSettings(
        @Query('path', new DefaultValuePipe('')) path: string
    ) {}

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
