import fs from 'fs'

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

function getFileSize(filename: string): number {
    let stats: fs.Stats
    try {
        stats = fs.statSync(filename)
    } catch (err) {
        throw err
    }
    return stats.size
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

function autoMkdirSync(path: string) {
    if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true })
}

export async function saveImage(
    sign: string,
    path: string,
    originFilename: string,
    rename?: boolean
) {
    let size: string
    try {
        size = String(getFileSize(originFilename))
    } catch (err) {
        throw err
    }

    autoMkdirSync(path)

    const type = getImageType(originFilename) || ''
    const newFilename = `${path}/${sign}.${type}`
    const metadata: ImageMetadata = {
        type,
        path,
        size,
        name: sign,
        filename: newFilename,
    }

    try {
        if (rename) await renameImage(originFilename, metadata.filename)
        else await copyImage(originFilename, metadata.filename)
    } catch (err) {
        throw err
    }

    return metadata
}
