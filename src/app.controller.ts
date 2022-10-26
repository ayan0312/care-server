import { BadRequestException, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { execSync } from 'child_process'
import { AssetService } from './asset/asset.service'
import { CharacterService } from './character/character.service'

@ApiTags('root')
@Controller()
export class AppController {
    constructor(
        // Don't remove following declarations.
        private readonly charService: CharacterService,
        private readonly assetService: AssetService
    ) {}

    @Get()
    public getApi() {
        return {
            HTML: '<h1>Care Server</h1>',
        }
    }

    @Post('/shutdown/windows')
    public shutdownWindows() {
        try {
            execSync('shutdown -s -t 00')
            return null
        } catch (err) {
            return new BadRequestException(err)
        }
    }
}
