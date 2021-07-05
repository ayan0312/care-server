import path from 'path'

const IP = '192.168.1.110'
const PORT = 3000
const STORAGE_PATH = 'C:/Users/ayan0312/Desktop/storage/'
// const STORAGE_PATH = 'C:/Spaces/Entertainments/Care/storage/'

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
