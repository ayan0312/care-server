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
    ParseArrayPipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'

import { CategoryService } from './category.service'

@ApiTags('character_categories')
@Controller('character/categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Get()
    public async find(@Query('name', new DefaultValuePipe('')) name: string) {
        if (name) return await this.categoryService.find(name)
        return await this.categoryService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create category',
    })
    public async create(@Body('name', new DefaultValuePipe('')) name: string) {
        return await this.categoryService.create(name)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.categoryService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body('name', new DefaultValuePipe('')) name: string
    ) {
        return await this.categoryService.update(id, name)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.categoryService.delete(id)
    }

    @Get('/relation')
    public async findRelations(
        @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
        ids?: number[]
    ) {
        if (ids && ids.length > 0)
            return await this.categoryService.findRelationsByIds(ids)
        return await this.categoryService.findRelations()
    }
}
