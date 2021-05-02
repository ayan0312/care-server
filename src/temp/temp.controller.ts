import {
    Controller,
    HttpException,
    HttpStatus,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import multer from 'multer'
import { config } from 'src/shared/config'
import { saveImage } from 'src/shared/image'

let tempId = 0

@ApiTags('temps')
@Controller('temps')
export class TempController {
    constructor() { }

    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    public async uploadImage(@UploadedFile() file: Express.Multer.File) {
        try {
            return saveImage(`${++tempId}${Date.now()}`, config.TEMP_PATH, file.fieldname)
        } catch (err) {
            throw new HttpException(
                {
                    errors: [err],
                },
                HttpStatus.BAD_REQUEST
            )
        }
    }
}
