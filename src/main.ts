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

    await app.listen(config.PORT)
}

function autoMkdir() {
    autoMkdirSync(config.STORAGE_PATH)
    autoMkdirSync(config.TEMP_PATH)
    autoMkdirSync(config.BACKUPS_PATH)
    autoMkdirSync(config.AVATARS_PATH)
    autoMkdirSync(config.AVATARS_200_PATH)
    autoMkdirSync(config.ASSETS_PATH)
    autoMkdirSync(config.ASSETS_300_PATH)
    autoMkdirSync(config.ASSETS_BIN_PATH)
    autoMkdirSync(config.FULL_LENGTH_PICTURES_PATH)
    autoMkdirSync(config.FULL_LENGTH_PICTURES_300_PATH)
}

function main() {
    autoMkdir()
    bootstrap()
}

main()
