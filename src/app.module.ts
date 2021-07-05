import { Connection } from 'typeorm'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'

import { AppController } from './app.controller'
import { CharacterModule } from './character/character.module'
import { config } from './shared/config'
import { TempModule } from './temp/temp.module'
import { ServeStaticModule } from '@nestjs/serve-static'
import { AssetModule } from './asset/asset.module'
import { CategoryModule } from './category/category.module'
import { TagModule } from './tag/tag.module'
import { AssetGroupModule } from './asset/group/group.module'
import { CharacterGroupModule } from './character/group/group.module'
import { ExtensionModule } from './extension/extension.module'

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: config.DATABASE_FILENAME,
            synchronize: true,
            autoLoadEntities: true,
        }),
        ServeStaticModule.forRoot({
            rootPath: config.STORAGE_PATH,
            exclude: [config.DATABASE_FILENAME],
            serveStaticOptions: {
                cacheControl: true,
                maxAge: 60 * 60 * 24 * 365,
            },
        }),
        MulterModule,
        TagModule,
        TempModule,
        AssetModule,
        CategoryModule,
        CharacterModule,
        ExtensionModule,
        AssetGroupModule,
        CharacterGroupModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class ApplicationModule {
    constructor(private readonly connection: Connection) {}
}
