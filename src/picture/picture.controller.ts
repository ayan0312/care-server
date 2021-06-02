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
    IPicture,
    IPictureSearch,
} from 'src/interface/picture/picture.interface'
import { ISettings } from 'src/interface/settings.interface'
import { CategoryService } from './category/category.service'
import { PictureService } from './picture.service'
import { GroupService } from './group/group.service'
import { TagService } from './tag/tag.service'

@ApiTags('pictures')
@Controller('pictures')
export class PictureController {
    constructor(
        private readonly tagService: TagService,
        private readonly groupService: GroupService,
        private readonly categoryService: CategoryService,
        private readonly picService: PictureService
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
    public async find(@Query('options') options: string) {
        return await this.picService.search(JSON.parse(options))
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create tag',
    })
    public async create(@Body() body: IPicture) {
        return await this.picService.create(body)
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
        return await this.picService.findById(id, relations)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IPicture
    ) {
        return await this.picService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.picService.delete(id)
    }
}
