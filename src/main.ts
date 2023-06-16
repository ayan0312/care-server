import { NestFactory } from '@nestjs/core'

import { ApplicationModule } from './app.module'
import { AllExceptionsFilter } from './shared/allExceptions.filter'
import { config } from './shared/config'
import { ResponseInterceptor } from './shared/response.interceptor'
import { autoMkdirSync } from './shared/file'
import compression from 'compression'
import { json, urlencoded } from 'express'

async function bootstrap() {
    const appOptions = { cors: true }
    const app = await NestFactory.create(ApplicationModule, appOptions)
    app.use(compression())
    app.use(json({ limit: '50mb' }))
    app.use(urlencoded({ extended: true, limit: '50mb' }))
    app.setGlobalPrefix('api')
    app.useGlobalFilters(new AllExceptionsFilter())
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.listen(config.port)
}

function autoMkdir() {
    autoMkdirSync(config.storage)
    autoMkdirSync(config.static.bin)
    autoMkdirSync(config.static.temps)
    autoMkdirSync(config.static.assets)
    autoMkdirSync(config.static.avatars)
    autoMkdirSync(config.static.fullbodys)
    autoMkdirSync(config.static.asset_thumbs)
    autoMkdirSync(config.static.avatar_thumbs)
    autoMkdirSync(config.static.fullbody_thumbs)
}

function main() {
    autoMkdir()
    bootstrap()
}

main()
