import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ExtensionEntity } from './extension.entity'

@Module({
    imports: [TypeOrmModule.forFeature([ExtensionEntity])],
    providers: [],
    controllers: [],
    exports: [],
})
export class ExtensionModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {}
}
