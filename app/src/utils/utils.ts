/* global network */

import { poseidonHashBN254 } from 'garaga'
import {
    BigNumberish,
    hash,
    byteArray,
    cairo,
    stark,
    Account,
    TypedData,
    WeierstrassSignatureType,
    num,
    addAddressPadding
} from 'starknet'
import { I256 } from './custom_type'
import { ethers } from 'ethers'
import { Keypair } from './keypair'

export const feltToString = (input: bigint | undefined): string => {
    return (
        input
            ?.toString(16)
            .match(/.{2}/g)
            ?.map((c: string) => String.fromCharCode(parseInt(c, 16)))
            .join('') || ''
    )
}

/**
 * Truncates a hex string to a shorter preview format.
 * Example: 0x1234567890abcdef...7890
 *
 * @param hex The full hex string (e.g. "0x..." or raw hex)
 * @param start Number of characters to keep at the start (default: 6)
 * @param end Number of characters to keep at the end (default: 4)
 * @returns Ellipsified hex string
 */
export function ellipsify(hex: string, start = 6, end = 4): string {
    if (!hex || typeof hex !== 'string') return ''
    if (hex.length <= start + end + 2) return hex // already short

    const prefix = hex.startsWith('0x') ? '0x' : ''
    const cleanHex = hex.replace(/^0x/, '')

    return `${prefix}${cleanHex.slice(0, start)}...${cleanHex.slice(-end)}`
}

export const FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

/** Generate random number of specified byte length */
export const randomBN = (nbytes: number = 31): BigNumberish =>
    BigInt(stark.randomAddress().slice(0, nbytes)) % FIELD_SIZE

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

export const uint8ArrayToBigInt = (uint8Array: Uint8Array): bigint => {
    // Convert Uint8Array to a hex string and then to BigInt
    const hexString = Buffer.from(uint8Array).toString('hex')

    return BigInt('0x' + hexString)
}

export const poseidonHash = (items: (string | number | BigNumberish)[]): BigNumberish => {
    let resultinghash = 0n
    for (let i = 0; i < items.length; i += 2) {
        const currentHash = poseidonHashBN254(BigInt(items[i]), BigInt(items[i + 1]))

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

const FIXED_MESSAGE = `You are about to generate your obscura private key by signing this message. This key lets the application decrypt your balance

IMPORTANT: Only sign this message if you trust the application.
`

// Define the typedData structure (EIP-712 style for Starknet)
const messageStructure: TypedData = {
    types: {
        StarkNetDomain: [
            { name: 'name', type: 'felt' },
            { name: 'chainId', type: 'felt' },
            { name: 'version', type: 'felt' }
        ],
        Message: [{ name: 'message', type: 'string' }]
    },
    primaryType: 'Message',
    domain: {
        name: 'Obscura',
        chainId: 'SN_SEPOLIA',
        version: '1'
    },
    message: {
        message: FIXED_MESSAGE
    }
}

// You are about to generate your obscura private key by signing this message. This key lets the application decrypt your balance

export async function generateKeypairFromSignature(account: Account): Promise<Keypair> {
    try {
        const signature = (await account.signMessage(messageStructure)) as WeierstrassSignatureType

        const keypair = new Keypair(addAddressPadding(num.toHex(signature.r)))

        return keypair
    } catch (error) {
        throw error
    }
}

export async function recoverAddressFromSignature(
    account: Account,
    signature: string
): Promise<string> {
    const msgHash = await account.hashMessage(messageStructure)

    return ethers.verifyMessage(msgHash, signature)

    //   return account.verifyMessageInStarknet(FIXED_MESSAGE, signature, account.address)
}
