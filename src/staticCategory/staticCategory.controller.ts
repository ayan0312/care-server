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
    Query,
    HttpCode,
    DefaultValuePipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { IStaticCategory } from 'src/interface/staticCategory.interface'

import { StaticCategoryService } from './staticCategory.service'

@ApiTags('static_categories')
@Controller('static_categories')
export class StaticCategoryController {
    constructor(private readonly categoryService: StaticCategoryService) {}
    @Get()
    public async find(@Query('name') name?: string) {
        if (name) return await this.categoryService.find(name)
        return await this.categoryService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create static category',
    })
    public async create(@Body() body: IStaticCategory) {
        return await this.categoryService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.categoryService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IStaticCategory
    ) {
        return await this.categoryService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query('force') force = false
    ) {
        return await this.categoryService.delete(id, force)
    }
}
