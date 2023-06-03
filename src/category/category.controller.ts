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
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { CategoryType, ICategory } from 'src/interface/category.interface'

import { CategoryService } from './category.service'

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}
    @Get()
    public async find(
        @Query('type', new ParseIntPipe()) type: number,
        @Query('name') name?: string
    ) {
        return await this.categoryService.find(
            name ? Object.assign({ type }, { name }) : { type }
        )
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create category',
    })
    public async create(@Body() body: ICategory) {
        return await this.categoryService.create(body)
    }

    @Get('/relation')
    public async findRelations(
        @Query('type', new ParseIntPipe()) type: CategoryType
    ) {
        return await this.categoryService.findRelations(type)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.categoryService.findById(id)
    }

    @Patch(':id')
    public async renameById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: ICategory
    ) {
        return await this.categoryService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.categoryService.delete(id)
    }
}
