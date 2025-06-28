/* global network */

import crypto from 'crypto'
import { poseidonHashBN254 } from 'garaga'
import { BigNumberish, hash, byteArray, cairo } from 'starknet'
import { I256 } from './custom_type'

export const FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

/** Generate random number of specified byte length */
export const randomBN = (nbytes: number = 31): BigNumberish =>
    BigInt('0x' + crypto.randomBytes(nbytes).toString('hex')) % FIELD_SIZE

export const bigintToUint8Array = (bigInt: bigint): Uint8Array => {
    // Take the modulus of bigInt with respect to the field size
    bigInt = bigInt % BigInt(FIELD_SIZE.toString())

    // Create a buffer large enough to hold 32 bytes (256 bits)
    const buffer = new ArrayBuffer(32)
    const view = new DataView(buffer)

    // Write the BigInt into the buffer as bytes
    for (let i = 0; i < 32; i++) {
        view.setUint8(31 - i, Number(bigInt & BigInt(0xff))) // Mask to get the last byte and set it
        bigInt >>= BigInt(8) // Shift BigInt by 8 bits (1 byte) to process the next byte
    }

    return new Uint8Array(buffer)
}
export const uint8ArrayToBigInt = (uint8Array: Uint8Array): BigInt => {
    // Convert Uint8Array to a hex string and then to BigInt
    let hexString = Buffer.from(uint8Array).toString('hex')

    return BigInt('0x' + hexString)
}

export const poseidonHash = (items: (string | number | BigNumberish)[]): BigNumberish => {
    let resultinghash = 0n
    for (let i = 0; i < items.length; i += 2) {
        let currentHash = poseidonHashBN254(BigInt(items[i]), BigInt(items[i + 1]))

        resultinghash = poseidonHashBN254(resultinghash, currentHash)
    }

    return resultinghash
}

export const poseidonHash2 = (
    a: string | number | BigNumberish,
    b: string | number | BigNumberish
): string => poseidonHashBN254(BigInt(a), BigInt(b)).toString()

/** BigNumber to hex string of specified length */
export function toFixedHex(
    value: string | number | BigNumberish | Buffer,
    length: number = 32
): string {
    let hex: string

    if (Buffer.isBuffer(value)) {
        hex = value.toString('hex')
    } else {
        const bigIntValue = BigInt(value)

        if (bigIntValue < 0n) {
            hex = (-bigIntValue).toString(16).padStart(length * 2, '0')
            return '-0x' + hex
        }

        hex = bigIntValue.toString(16)
    }

    // Remove leading "0x" if present
    if (hex.startsWith('0x')) {
        hex = hex.slice(2)
    }

    return '0x' + hex.padStart(length * 2, '0')
}

/** Convert value into buffer of specified byte length */
export function toBuffer(value: string | number | BigNumberish, length: number): Buffer {
    const hex = value.toString(16).padStart(length * 2, '0')
    return Buffer.from(hex, 'hex')
}

type ExtDataInput = {
    recipient: string
    ext_amount: I256
    relayer: string
    fee: string | number | BigNumberish
    encrypted_output1: string
    encrypted_output2: string
}

export function getExtDataHash({
    recipient,
    ext_amount,
    relayer,
    fee,
    encrypted_output1,
    encrypted_output2
}: ExtDataInput): BigNumberish {
    const encryptedOutput1Felts = byteArray.byteArrayFromString(encrypted_output1)
    const encryptedOutput2Felts = byteArray.byteArrayFromString(encrypted_output2)
    const extAmountU256 = cairo.uint256(ext_amount.value)
    const feeU256 = cairo.uint256(toFixedHex(fee))
    const serializedExtData = [
        recipient,
        extAmountU256.low,
        extAmountU256.high,
        ext_amount.is_negative ? 1 : 0,
        relayer,
        feeU256.low,
        feeU256.high,
        ...[
            encryptedOutput1Felts.data.length as BigNumberish,
            ...encryptedOutput1Felts.data,
            encryptedOutput1Felts.pending_word,
            encryptedOutput1Felts.pending_word_len
        ],
        ...[
            encryptedOutput2Felts.data.length as BigNumberish,
            ...encryptedOutput2Felts.data,
            encryptedOutput2Felts.pending_word,
            encryptedOutput2Felts.pending_word_len
        ]
    ]
    const extDataHash = hash.computePoseidonHashOnElements(serializedExtData)

    return extDataHash
}

export function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length
    let randomIndex: number

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--

        // Swap
        ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
    }

    return array
}

// export async function getSignerFromAddress(address: string) {
//   await network.provider.request({
//     method: 'hardhat_impersonateAccount',
//     params: [address],
//   })

//   return await ethers.provider.getSigner(address)
// }

module.exports = {
    FIELD_SIZE,
    randomBN,
    toFixedHex,
    toBuffer,
    poseidonHash,
    poseidonHash2,
    getExtDataHash,
    shuffle
    //   getSignerFromAddress,
}
