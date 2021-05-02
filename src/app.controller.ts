import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('root')
@Controller()
export class AppController {
    @Get()
    public getApi() {
        return '<h1>care server</h1>'
    }
}
