import {
    Get,
    Controller,
    Param,
    HttpStatus,
    Post,
    ParseIntPipe,
    Body,
    Delete,
    Patch,
    HttpCode,
    Query,
    ParseArrayPipe,
    DefaultValuePipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import {
    ICharacter,
    ICharacterSearch,
} from 'src/interface/character/character.interface'
import { ISettings } from 'src/interface/settings.interface'
import { CategoryService } from './category/category.service'
import { CharacterService } from './character.service'
import { GroupService } from './group/group.service'
import { TagService } from './tag/tag.service'

@ApiTags('characters')
@Controller('characters')
export class CharacterController {
    constructor(
        private readonly tagService: TagService,
        private readonly groupService: GroupService,
        private readonly categoryService: CategoryService,
        private readonly charService: CharacterService
    ) { }

    @Post('settings')
    public async uploadSettings(@Body() settings: ISettings) {
        // groups
        if (settings.groups && settings.groups.length > 0)
            for (let i in settings.groups)
                await this.groupService.create(settings.groups[i])

        // categories
        if (settings.categories && settings.categories.length > 0) {
            for (let i in settings.categories) {
                const { name, tags } = settings.categories[i]
                const category = await this.categoryService.create(name)
                for (let j in tags) {
                    this.tagService.create({
                        name: tags[j],
                        categoryId: category.id,
                    })
                }
            }
        }
    }

    @Get()
    public async find(@Query() body: ICharacterSearch) {
        return await this.charService.search(body)
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create tag',
    })
    public async create(@Body() body: ICharacter) {
        return await this.charService.create(body)
    }

    @Get(':id')
    public async findById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query(
            'relations',
            new DefaultValuePipe(''),
            new ParseArrayPipe({ items: String, separator: ',' })
        )
        relations: string[]
    ) {
        if (relations.includes('category'))
            return await this.charService.findCategoryRelationsById(id)
        return await this.charService.findById(id, relations)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: ICharacter
    ) {
        return await this.charService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.charService.delete(id)
    }
}
