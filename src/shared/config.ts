import os from 'os'

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
                !info.internal
            )
                return info.address
        }
    }

    return 'localhost'
}

const IP = getIP()
const PORT = 3000
const STORAGE_PATH = 'F:/storage/'

export const config = {
    IP,
    PORT,
    STORAGE_PATH,
    ...createPaths(STORAGE_PATH),
    URL: {
        ...createPaths(`http://${IP}:${PORT}/`),
    },
}

function createPaths(root: string) {
    return {
        TEMP_PATH: root + 'temps/',
        BACKUPS_PATH: root + 'backups/',
        AVATARS_PATH: root + 'avatars/',
        AVATARS_200_PATH: root + 'avatars/200/',
        ASSETS_PATH: root + 'assets/',
        ASSETS_300_PATH: root + 'assets/300/',
        DATABASE_FILENAME: root + 't.db',
        FULL_LENGTH_PICTURES_PATH: root + 'fullLengthPictures/',
        FULL_LENGTH_PICTURES_300_PATH: root + 'fullLengthPictures/300/',
    }
}
