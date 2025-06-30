import { BigNumberish } from 'starknet'
import { randomBN, toBuffer, poseidonHash2 } from './utils'
import { Keypair } from './keypair'

export default class Utxo {
    amount: BigNumberish
    blinding: BigNumberish
    keypair: Keypair
    index: number | null
    private _commitment?: BigNumberish
    private _nullifier?: BigNumberish

    constructor({
        amount = 0,
        keypair = new Keypair(),
        blinding = randomBN(),
        index = null
    }: {
        amount?: BigNumberish | bigint | number | string
        blinding?: BigNumberish | bigint | number | string
        keypair?: Keypair
        index?: number | null
    } = {}) {
        this.amount = BigInt(amount)
        this.blinding = BigInt(blinding)
        this.keypair = keypair
        this.index = index
    }

    /**
     * Returns the commitment for this UTXO.
     */
    getCommitment(): BigNumberish {
        if (!this._commitment) {
            this._commitment = poseidonHash2(
                poseidonHash2(this.amount, this.amount),
                poseidonHash2(this.keypair.pubkey, this.blinding)
            )
        }

        return this._commitment || BigInt(0)
    }

    /**
     * Returns the nullifier for this UTXO.
     */
    getNullifier(): BigNumberish {
        if (!this._nullifier) {
            if (
                BigInt(this.amount) > 0n &&
                (this.index === undefined ||
                    this.index === null ||
                    this.keypair.privkey === undefined ||
                    this.keypair.privkey === null)
            ) {
                throw new Error('Can not compute nullifier without utxo index or private key')
            }

            const signature =
                this.keypair.privkey != null
                    ? this.keypair.sign(this.getCommitment(), this.index ?? 0)
                    : BigInt(0)

            this._nullifier = poseidonHash2(
                poseidonHash2(this.getCommitment(), this.getCommitment()),
                poseidonHash2(this.index ?? 0, signature)
            )
        }

        return this._nullifier || BigInt(0)
    }

    /**
     * Encrypt the UTXO.
     */
    encrypt(): string {
        const bytes = Buffer.concat([toBuffer(this.amount, 31), toBuffer(this.blinding, 31)])
        return this.keypair.encrypt(bytes)
    }

    /**
     * Decrypt an encrypted UTXO string.
     */
    static decrypt(keypair: Keypair, data: string, index: number): Utxo {
        const buf = keypair.decrypt(data)
        return new Utxo({
            amount: BigInt('0x' + buf.subarray(0, 31).toString('hex')),
            blinding: BigInt('0x' + buf.subarray(31, 62).toString('hex')),
            keypair,
            index
        })
    }
}
