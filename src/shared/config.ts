import os from 'os'

const DEFAULT = {
    ip: '192.168.3.6',
    port: 3000,
    storage: 'C:/Spaces/Storage',
    thumb: {
        maxWidth: 800,
    },
}

export function createStaticPaths(root: string) {
    return {
        bin: root + 'bin/',
        temps: root + 'temps/',
        assets: root + 'assets/',
        avatars: root + 'avatars/',
        fullbodys: root + 'fullbodys/',
        asset_thumbs: root + 'asset_thumbs/',
        avatar_thumbs: root + 'avatar_thumbs/',
        fullbody_thumbs: root + 'fullbody_thumbs/',
    }
}

export const config = {
    ...DEFAULT,
    database: DEFAULT.storage + '/database/t.db',
    api: `http://${DEFAULT.ip}:${DEFAULT.port}/api/`,
    URL: {
        ...createStaticPaths(`http://${DEFAULT.ip}:${DEFAULT.port}/static/`),
    },
    static: {
        ...createStaticPaths(DEFAULT.storage + '/static/'),
    },
}

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
