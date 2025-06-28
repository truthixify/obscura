import { encrypt, decrypt, getEncryptionPublicKey } from 'eth-sig-util'
import { ethers } from 'ethers'
import { toFixedHex, poseidonHash2, FIELD_SIZE } from './utils'
import { BigNumberish } from 'starknet'

export type EncryptedMessage = {
    version: string
    nonce: string
    ephemPublicKey: string
    ciphertext: string
}

export function packEncryptedMessage(encryptedMessage: EncryptedMessage): string {
    const nonceBuf = Buffer.from(encryptedMessage.nonce, 'base64')
    const ephemPublicKeyBuf = Buffer.from(encryptedMessage.ephemPublicKey, 'base64')
    const ciphertextBuf = Buffer.from(encryptedMessage.ciphertext, 'base64')

    const messageBuff = Buffer.concat([
        Buffer.alloc(24 - nonceBuf.length),
        nonceBuf,
        Buffer.alloc(32 - ephemPublicKeyBuf.length),
        ephemPublicKeyBuf,
        ciphertextBuf
    ])

    return '0x' + messageBuff.toString('hex')
}

export function unpackEncryptedMessage(encryptedMessage: string): EncryptedMessage {
    if (encryptedMessage.startsWith('0x')) {
        encryptedMessage = encryptedMessage.slice(2)
    }
    const messageBuff = Buffer.from(encryptedMessage, 'hex')
    const nonceBuf = messageBuff.slice(0, 24)
    const ephemPublicKeyBuf = messageBuff.slice(24, 56)
    const ciphertextBuf = messageBuff.slice(56)

    return {
        version: 'x25519-xsalsa20-poly1305',
        nonce: nonceBuf.toString('base64'),
        ephemPublicKey: ephemPublicKeyBuf.toString('base64'),
        ciphertext: ciphertextBuf.toString('base64')
    }
}

export class Keypair {
    privkey: string | null
    pubkey: BigNumberish
    encryptionKey: string

    constructor(privkey: string = ethers.Wallet.createRandom().privateKey) {
        this.privkey = privkey // num.toHex(BigInt(privkey) % FIELD_SIZE)
        this.pubkey = poseidonHash2(
            BigInt(this.privkey) % FIELD_SIZE,
            BigInt(this.privkey) % FIELD_SIZE
        )
        this.encryptionKey = getEncryptionPublicKey(this.privkey.slice(2))
    }

    toString(): string {
        return toFixedHex(this.pubkey) + Buffer.from(this.encryptionKey, 'base64').toString('hex')
    }

    address(): string {
        return this.toString()
    }

    static fromString(str: string): Keypair {
        if (str.length === 130) {
            str = str.slice(2)
        }
        if (str.length !== 128) {
            throw new Error('Invalid key length')
        }

        const keypair = new Keypair()
        keypair.privkey = null
        keypair.pubkey = BigInt('0x' + str.slice(0, 64))
        keypair.encryptionKey = Buffer.from(str.slice(64, 128), 'hex').toString('base64')
        return keypair
    }

    sign(
        commitment: string | number | BigNumberish,
        merklePath: string | number | BigNumberish
    ): BigNumberish {
        if (!this.privkey) {
            throw new Error('Cannot sign without private key')
        }
        return poseidonHash2(
            poseidonHash2(BigInt(this.privkey), BigInt(this.privkey)),
            poseidonHash2(BigInt(commitment), BigInt(merklePath))
        )
    }

    encrypt(bytes: Buffer): string {
        return packEncryptedMessage(
            encrypt(
                this.encryptionKey,
                { data: bytes.toString('base64') },
                'x25519-xsalsa20-poly1305'
            )
        )
    }

    decrypt(data: string): Buffer {
        if (!this.privkey) {
            throw new Error('Cannot decrypt without private key')
        }
        const unpacked = unpackEncryptedMessage(data)
        const decryptedBase64 = decrypt(unpacked, this.privkey.slice(2))
        return Buffer.from(decryptedBase64, 'base64')
    }
}

module.exports = {
    Keypair,
    packEncryptedMessage,
    unpackEncryptedMessage
}
