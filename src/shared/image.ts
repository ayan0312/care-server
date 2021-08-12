import fs from 'fs'
import gm from 'gm'

export interface ImageMetadata {
    name: string
    type: string
    path: string
    size: string
    filename: string
}

function getImageType(filename: string): string | false {
    if (filename.indexOf('.') <= -1) return false
    const types = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
    const arr = filename.split('.')
    const type = arr[arr.length - 1]
    if (!types.includes(type)) return false
    return type
}

function copyImage(oldPath: string, newPath: string): Promise<void> {
    let readStream = fs.createReadStream(oldPath)
    let writeStream = fs.createWriteStream(newPath)
    readStream.pipe(writeStream)

    return new Promise((resolve, reject) => {
        readStream.on('error', (err) => {
            reject(err)
        })

        writeStream.on('finish', () => {
            writeStream.end()
            resolve()
        })
    })
}

function renameImage(oldPath: string, newPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                reject(err)
                return
            }
            resolve()
        })
    })
}

export function autoMkdirSync(path: string) {
    if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true })
}

export async function saveImage(
    sign: string,
    path: string,
    originFilename: string,
    rename?: boolean
) {
    let size = String(fs.statSync(originFilename))
    autoMkdirSync(path)

    const type = getImageType(originFilename) || ''
    const metadata: ImageMetadata = {
        type,
        path,
        size,
        name: `${sign}.${type}`,
        filename: `${path}/${sign}.${type}`,
    }

    if (rename) await renameImage(originFilename, metadata.filename)
    else await copyImage(originFilename, metadata.filename)

    return metadata
}

export async function getImageSize(filename: string) {
    return new Promise((resolve: (size: gm.Dimensions) => void, reject) => {
        gm(filename).size(function (err, size) {
            if (err) {
                reject(err)
                return
            }
            resolve(size)
        })
    })
}

const limit = 1024 * 1024 * 200

export async function clipImage(
    origin: string,
    target: string,
    maxWidth: number
) {
    const size = await getImageSize(origin)
    let width = maxWidth

    if (size.width < width) return false

    return new Promise((resolve: (d: true) => void, reject) => {
        gm(origin)
            .resize(width)
            .write(target, (err) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(true)
            })
    })
}
