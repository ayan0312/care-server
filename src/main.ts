import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

import { ApplicationModule } from './app.module'
import { AllExceptionsFilter } from './shared/allExceptions.filter'
import { config } from './shared/config'
import { ResponseInterceptor } from './shared/response.interceptor'
import { autoMkdirSync } from './shared/file'
import compression from 'compression'

async function bootstrap() {
    const appOptions = { cors: true }
    const app = await NestFactory.create(ApplicationModule, appOptions)
    app.use(compression())
    app.setGlobalPrefix('api')
    app.useGlobalFilters(new AllExceptionsFilter())
    app.useGlobalInterceptors(new ResponseInterceptor())

    const options = new DocumentBuilder()
        .setTitle('care-server')
        .setDescription('care-server API description')
        .setVersion('1.0')
        .addTag('root')
        .build()

    const document = SwaggerModule.createDocument(app, options)
    SwaggerModule.setup('docs', app, document)

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
