import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CategoryTemplateService } from './template.service'

@ApiTags('character_category_templates')
@Controller('character/category/templates')
export class CategoryTemplateController {
    constructor(private readonly categoryService: CategoryTemplateService) {}

    @Get()
    public async findAll() {
        return this.categoryService.findAll()
    }
}
