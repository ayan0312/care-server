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

@ApiTags('picture_categories')
@Controller('picture/categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}
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

    @Get('/relation')
    public async findRelations() {
        return await this.categoryService.findRelations()
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
}
