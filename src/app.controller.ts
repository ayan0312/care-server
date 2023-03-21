import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssetService } from './asset/asset.service'
import { CharacterService } from './character/character.service'
import { config } from './shared/config'

@ApiTags('root')
@Controller()
export class AppController {
    constructor(
        // Don't remove following declarations.
        private readonly charService: CharacterService,
        private readonly assetService: AssetService
    ) {}

    @Get()
    public getAPI() {
        return {
            static: config.URL,
        }
    }
}
