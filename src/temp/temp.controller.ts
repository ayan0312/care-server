import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import multer from 'multer'
import { config } from 'src/shared/config'

let tempId = 0

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.TEMP_PATH)
    },
    filename: function (req, file, cb) {
        let exts = file.mimetype.split('/')
        let ext = exts[exts.length - 1]
        cb(null, `${Date.now()}.${++tempId}.${ext}`)
    },
})

@ApiTags('temps')
@Controller('temps')
export class TempController {
    constructor() {}

    @Post()
    @UseInterceptors(
        FileInterceptor('image', {
            storage,
            preservePath: true,
        })
    )
    public async uploadImage(@UploadedFile() file: Express.Multer.File) {
        return {
            size: file.size,
            filename: file.filename,
            mimetype: file.mimetype,
            originalname: file.originalname,
        }
    }
}
