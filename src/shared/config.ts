import os from 'os'
import fs from 'fs-extra'
import path from 'path'

const STORAGE_PATH = 'D:/storage/'
const DEFAULT_CONFIG = (() => ({
    PORT: 3000,
    IMPORT_DIR: os.homedir(),
    EXPORT_DIR: os.homedir(),
}))()

function getIP() {
    const interfaces = os.networkInterfaces()
    for (let netName in interfaces) {
        const infos = interfaces[netName]
        if (!infos) continue
        for (let i = 0; i < infos.length; i++) {
            const info = infos[i]
            if (
                info.family === 'IPv4' &&
                info.address !== '127.0.0.1' &&
                info.address.indexOf('192.168') > -1 &&
                !info.internal
            ) {
                return info.address
            }
        }
    }

    return 'localhost'
}

function createConfig() {
    const configPath = STORAGE_PATH + 'config.json'
    let config: Partial<typeof DEFAULT_CONFIG> = {}
    if (fs.pathExistsSync(configPath)) config = fs.readJSONSync(configPath)
    else
        fs.outputJSONSync(
            path.join(STORAGE_PATH, 'config.json'),
            DEFAULT_CONFIG
        )

    return Object.assign(DEFAULT_CONFIG, config)
}

function createPaths(root: string) {
    return {
        TEMP_PATH: root + 'temps/',
        BACKUPS_PATH: root + 'backups/',
        AVATARS_PATH: root + 'avatars/',
        AVATARS_200_PATH: root + 'avatars/200/',
        ASSETS_PATH: root + 'assets/',
        ASSETS_300_PATH: root + 'assets/300/',
        ASSETS_BIN_PATH: root + 'bin/',
        DATABASE_FILENAME: root + 't.db',
        FULL_LENGTH_PICTURES_PATH: root + 'fullLengthPictures/',
        FULL_LENGTH_PICTURES_300_PATH: root + 'fullLengthPictures/300/',
    }
}

const IP = '192.168.3.6' // getIP()
const originalConfig = createConfig()
export const config = {
    IP,
    STORAGE_PATH,
    ...originalConfig,
    ...createPaths(STORAGE_PATH),
    URL: {
        ...createPaths(`http://${IP}:${originalConfig.PORT}/`),
    },
}
