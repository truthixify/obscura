export function flattenFieldsAsArray(fields: string[]): Uint8Array {
    const flattenedPublicInputs = fields.map(hexToUint8Array)
    return flattenUint8Arrays(flattenedPublicInputs)
}

function flattenUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, val) => acc + val.length, 0)
    const result = new Uint8Array(totalLength)

    let offset = 0
    for (const arr of arrays) {
        result.set(arr, offset)
        offset += arr.length
    }

    return result
}

function hexToUint8Array(hex: string): Uint8Array {
    const sanitisedHex = BigInt(hex).toString(16).padStart(64, '0')

    const len = sanitisedHex.length / 2
    const u8 = new Uint8Array(len)

    let i = 0
    let j = 0
    while (i < len) {
        u8[i] = parseInt(sanitisedHex.slice(j, j + 2), 16)
        i += 1
        j += 2
    }

    return u8
}
