export namespace RelationshipsParser {
    /**
     *
     * @param str 12?1+2+3 / 12?1
     * @returns
     */
    export function parse(str: string) {
        const anys = str.split('?')
        const rId = Number(anys[0])

        if (typeof rId !== 'number' || isNaN(rId))
            throw new SyntaxError(`${rId}`)

        const cIdstr = anys[1] || ''
        const cIds = cIdstr.split('+')

        cIds.forEach((id) => {
            const n = Number(id)
            if (typeof n !== 'number' || isNaN(n)) throw new SyntaxError(id)
        })

        return {
            characterIds: cIds,
            relationshipId: Number(rId),
        }
    }
}

export namespace StaticCategoriesParser {
    const enum Tokens {
        ID = 0,
        AND,
        PERHAPS,
        NUMBER,
        STRING,
    }

    /**
     *
     * @param template ageId(3) / ageId(3?+14?"istanbul") / nameId("us"&"sb"+"cn"&"nb") / selectId(30&A)
     */
    function tokenize(dsl: string) {}

    export function parse(tokens: any) {}
}
