import { deployTestContract } from './deploy'
import { Contract, RpcProvider, Account, num, addAddressPadding, stark } from 'starknet'
import { Keypair } from '../utils/keypair'
import Utxo from '../utils/utxo'
import { registerAndTransact, transaction } from '../utils/index'
import { init as initGaraga } from 'garaga'
import {
    parseNewCommitEvent,
    parsePublicKeyEvent
} from '../utils/events_parsing'

describe('Obscura Test', () => {
    let obscura: Contract
    let alice: Account
    let bob: Account
    let provider: RpcProvider
    let strkToken: Contract

    beforeAll(async () => {
        provider = new RpcProvider({ nodeUrl: process.env.RPC_URL_DEVNET })
        // Test account generated from starknet devnet, these accounts have already been deployed when you run `yarn chain`
        const privateKey = process.env.PRIVATE_KEY_DEVNET || ''
        const accountAddress = process.env.ACCOUNT_ADDRESS_DEVNET || ''
        alice = new Account(provider, accountAddress, privateKey)
        bob = new Account(
            provider,
            '0x078662e7352d062084b0010068b99288486c2d8b914f6e2a55ce945f8792c8b1',
            '0x000000000000000000000000000000000e1406455b7d66b1690803be066cbe5e'
        )
        ;({ obscura, strkToken } = await deployTestContract(5, BigInt(10000 * 1e18)))

        await initGaraga()
    })

    it('encrypt -> decrypt should work', async () => {
        // Data to encrypt and decrypt
        const data = Buffer.from([0xff, 0xaa, 0x00, 0x01])
        // Generate a new keypair
        const keypair = new Keypair()
        // Encrypt the data
        const ciphertext = keypair.encrypt(data)
        // Decrypt the ciphertext
        const result = keypair.decrypt(ciphertext)
        // Assert that the decrypted data matches the original data
        expect(result).toEqual(data)
    })

    it('constants check', async () => {
        const maxFee = await obscura.max_fee()
        const maxExtAmount = await obscura.max_ext_amount()
        const fieldSize = await obscura.field_size()

        // Assert that the maximum fee is less than the field size
        expect(maxExtAmount + maxFee).toBeLessThan(fieldSize)
    })

    it('should return false for an unspent nullifier', async () => {
        const is_spent = await obscura.is_spent(0)

        // Assert that the nullifier is not spent
        expect(is_spent).toBe(false)
    })

    it('should register an account and emit the right event', async () => {
        // Generate a new keypair
        const keypair = new Keypair()
        // Create a new account object
        const bobAccount = {
            owner: bob.address,
            public_key: keypair.address()
        }

        // Connect the Obscura contract to the Bob account
        obscura.connect(bob)
        // Register the Bob account
        await obscura.register(bobAccount)

        const [parsedEvent] = (await parsePublicKeyEvent(obscura, provider, [alice.address])).slice(
            -1
        )

        // Assert that the register event is emitted
        expect(addAddressPadding(num.toHex(parsedEvent.owner))).toEqual(bobAccount.owner)
        expect(parsedEvent.key).toEqual(bobAccount.public_key)
    })

    it('should register and deposit', async function () {
        // Alice deposits into obscura
        const aliceDepositAmount = 1e7
        const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount })

        obscura.connect(alice)
        strkToken.connect(alice)

        strkToken.approve(obscura.address, aliceDepositAmount)

        await registerAndTransact({
            obscura,
            provider,
            outputs: [aliceDepositUtxo],
            account: {
                owner: alice.address,
                public_key: aliceDepositUtxo.keypair.address()
            }
        })

        const [parsedEvent] = (await parsePublicKeyEvent(obscura, provider, [alice.address])).slice(
            -1
        )

        expect(addAddressPadding(num.toHex(parsedEvent.owner))).toEqual(alice.address)
        expect(parsedEvent.key).toEqual(aliceDepositUtxo.keypair.address())
    })

    it('should deposit, transact and withdraw', async function () {
        // Alice deposits into obscura pool
        const aliceKeypair = new Keypair()
        const aliceDepositAmount = BigInt(1e18)
        const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keypair: aliceKeypair })

        obscura.connect(alice)
        strkToken.connect(alice)
        strkToken.approve(obscura.address, aliceDepositAmount)

        await transaction({ obscura, outputs: [aliceDepositUtxo], provider })

        // Bob gives Alice address to send some eth inside the shielded pool
        const bobKeypair = new Keypair()
        const bobAddress = bobKeypair.address()

        // Alice sends some funds to Bob
        const bobSendAmount = BigInt(6e17)
        const bobSendUtxo = new Utxo({
            amount: bobSendAmount,
            keypair: Keypair.fromString(bobAddress)
        })
        const aliceChangeUtxo = new Utxo({
            amount: aliceDepositAmount - bobSendAmount,
            keypair: aliceKeypair
        })

        await transaction({
            obscura,
            inputs: [aliceDepositUtxo],
            outputs: [bobSendUtxo, aliceChangeUtxo],
            provider
        })

        // Bob parses chain to detect incoming funds
        const lastBlock = await provider.getBlock('latest')
        const parsedNewCommitEvent = (
            await parseNewCommitEvent(obscura, provider, { block_number: lastBlock.block_number })
        ).slice(-2)

        let bobReceiveUtxo: Utxo
        try {
            bobReceiveUtxo = Utxo.decrypt(
                bobKeypair,
                parsedNewCommitEvent[0].encrypted_output,
                parsedNewCommitEvent[0].index
            )
        } catch (error) {
            // we try to decrypt another output here because it shuffles outputs before sending to blockchain
            bobReceiveUtxo = Utxo.decrypt(
                bobKeypair,
                parsedNewCommitEvent[1].encrypted_output,
                parsedNewCommitEvent[1].index
            )
        }

        expect(bobReceiveUtxo.amount).toEqual(BigInt(bobSendAmount))

        obscura.connect(bob)

        // Bob withdraws a part of his funds from the shielded pool
        const bobWithdrawalAmount = BigInt(5e17)
        const bobWithdrawalStrkAddress = stark.randomAddress()
        const bobBalanceBefore = await strkToken.balanceOf(bobWithdrawalStrkAddress)
        const bobChangeUtxo = new Utxo({
            amount: bobSendAmount - bobWithdrawalAmount,
            keypair: bobKeypair
        })

        await transaction({
            obscura,
            inputs: [bobReceiveUtxo],
            outputs: [bobChangeUtxo],
            recipient: bobWithdrawalStrkAddress,
            provider
        })

        const bobBalanceAfter = await strkToken.balanceOf(bobWithdrawalStrkAddress)

        expect(bobBalanceAfter).toEqual(bobBalanceBefore + BigInt(bobWithdrawalAmount))
    })
})
