import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssetService } from './asset/asset.service'
import { CharacterService } from './character/character.service'
import { config } from './shared/config'
import { CategoryService } from './category/category.service'

@ApiTags('root')
@Controller()
export class AppController {
    constructor(
        // Don't remove following declarations.
        private readonly charService: CharacterService,
        private readonly assetService: AssetService,
        private readonly categoryService: CategoryService
    ) {}

    @Get()
    public getAPI() {
        return config.URL
    }
}
