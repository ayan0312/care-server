import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssetService } from './asset/asset.service'
import { CharacterService } from './character/character.service'

@ApiTags('root')
@Controller()
export class AppController {
    constructor(
        private readonly charService: CharacterService,
        private readonly assetService: AssetService
    ) {}

    @Get()
    public getApi() {
        return {
            HTML: '<h1>Care Server</h1>',
        }
    }
}
