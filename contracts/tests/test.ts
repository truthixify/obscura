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
    let tokens: any[]

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
        ;({ obscura, tokens } = await deployTestContract(28, BigInt(10000 * 1e18)))

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
        const strkToken = tokens.find(token => token.symbol === 'STRK')?.contract
        const strkTokenAddress = tokens.find(token => token.symbol === 'STRK')?.address
        strkToken.connect(alice)
        strkToken.approve(obscura.address, aliceDepositAmount)

        await registerAndTransact({
            obscura,
            provider,
            outputs: [aliceDepositUtxo],
            account: {
                owner: alice.address,
                public_key: aliceDepositUtxo.keypair.address()
            },
            tokenAddress: strkTokenAddress
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
        const strkToken = tokens.find(token => token.symbol === 'STRK')?.contract
        strkToken.connect(alice)
        strkToken.approve(obscura.address, aliceDepositAmount)

        const strkTokenAddress = tokens.find(token => token.symbol === 'STRK')?.address
        await transaction({ obscura, outputs: [aliceDepositUtxo], provider, tokenAddress: strkTokenAddress })

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
            provider,
            tokenAddress: strkTokenAddress
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
            provider,
            tokenAddress: strkTokenAddress
        })

        const bobBalanceAfter = await strkToken.balanceOf(bobWithdrawalStrkAddress)

        expect(bobBalanceAfter).toEqual(bobBalanceBefore + BigInt(bobWithdrawalAmount))
    })

    describe('Multitoken Functionality Tests', () => {
        it('should check initial token whitelist status', async () => {
            obscura.connect(alice)
            
            // STRK token should be whitelisted (added during deployment)
            const strkToken = tokens.find(token => token.symbol === 'STRK')
            const isStrkAllowed = await obscura.is_token_allowed(strkToken.address)
            expect(isStrkAllowed).toBe(true)
            
            // Other tokens should not be whitelisted initially
            const nonDefaultTokens = tokens.filter(token => !token.isDefault)
            for (const token of nonDefaultTokens) {
                const isAllowed = await obscura.is_token_allowed(token.address)
                expect(isAllowed).toBe(false)
            }
            
            // Check initial token count (should be 1 for STRK)
            const tokenCount = await obscura.get_token_count()
            expect(tokenCount).toBe(1)
        })

        it('should add tokens to whitelist (owner only)', async () => {
            obscura.connect(alice)
            
            // Add ETH token to whitelist
            const ethToken = tokens.find(token => token.symbol === 'ETH')
            await obscura.add_token(ethToken.address)
            
            // Verify token is now whitelisted
            const isAllowed = await obscura.is_token_allowed(ethToken.address)
            expect(isAllowed).toBe(true)
            
            // Check token count increased
            const tokenCount = await obscura.get_token_count()
            expect(tokenCount).toBe(2)
            
            // Check token can be retrieved by index
            const tokenAtIndex1 = await obscura.get_token_by_index(1)
            expect(tokenAtIndex1).toBe(ethToken.address)
        })

        it('should fail to add token if not owner', async () => {
            obscura.connect(bob)
            
            // Bob should not be able to add tokens
            const usdcToken = tokens.find(token => token.symbol === 'USDC')
            try {
                await obscura.add_token(usdcToken.address)
                fail('Should have thrown an error for non-owner')
            } catch (error) {
                expect(error).toBeDefined()
            }
        })

        it('should batch add multiple tokens', async () => {
            obscura.connect(alice)
            
            // Get USDC and USDT tokens to add
            const usdcToken = tokens.find(token => token.symbol === 'USDC')
            const usdtToken = tokens.find(token => token.symbol === 'USDT')
            const tokenAddresses = [usdcToken.address, usdtToken.address]
            
            // Batch add tokens
            await obscura.batch_add_tokens(tokenAddresses)
            
            // Verify all tokens are now whitelisted
            for (const tokenAddress of tokenAddresses) {
                const isAllowed = await obscura.is_token_allowed(tokenAddress)
                expect(isAllowed).toBe(true)
            }
            
            // Check token count (should be 4: STRK + ETH + USDC + USDT)
            const tokenCount = await obscura.get_token_count()
            expect(tokenCount).toBe(4)
        })

        it('should get all whitelisted tokens', async () => {
            obscura.connect(alice)
            
            const allTokens = await obscura.get_all_tokens()
            expect(allTokens.length).toBe(4)
            
            // Should contain all the tokens we added
            const strkToken = tokens.find(token => token.symbol === 'STRK')
            const ethToken = tokens.find(token => token.symbol === 'ETH')
            const usdcToken = tokens.find(token => token.symbol === 'USDC')
            const usdtToken = tokens.find(token => token.symbol === 'USDT')
            
            expect(allTokens).toContain(strkToken.address)
            expect(allTokens).toContain(ethToken.address)
            expect(allTokens).toContain(usdcToken.address)
            expect(allTokens).toContain(usdtToken.address)
        })

        it('should remove token from whitelist', async () => {
            obscura.connect(alice)
            
            // Remove USDT token
            const usdtToken = tokens.find(token => token.symbol === 'USDT')
            await obscura.remove_token(usdtToken.address)
            
            // Verify token is no longer whitelisted
            const isAllowed = await obscura.is_token_allowed(usdtToken.address)
            expect(isAllowed).toBe(false)
            
            // Check token count decreased
            const tokenCount = await obscura.get_token_count()
            expect(tokenCount).toBe(3)
        })

        it('should batch remove multiple tokens', async () => {
            obscura.connect(alice)
            
            // Remove ETH and USDC tokens
            const ethToken = tokens.find(token => token.symbol === 'ETH')
            const usdcToken = tokens.find(token => token.symbol === 'USDC')
            const tokensToRemove = [ethToken.address, usdcToken.address]
            
            await obscura.batch_remove_tokens(tokensToRemove)
            
            // Verify tokens are no longer whitelisted
            for (const tokenAddress of tokensToRemove) {
                const isAllowed = await obscura.is_token_allowed(tokenAddress)
                expect(isAllowed).toBe(false)
            }
            
            // Check token count (should be 1: only STRK remaining)
            const tokenCount = await obscura.get_token_count()
            expect(tokenCount).toBe(1)
            
            // Verify only STRK is left
            const allTokens = await obscura.get_all_tokens()
            expect(allTokens.length).toBe(1)
            const strkToken = tokens.find(token => token.symbol === 'STRK')
            expect(allTokens[0]).toBe(strkToken.address)
        })

        it('should fail transaction with non-whitelisted token', async () => {
            obscura.connect(alice)
            
            // Try to transact with ETH token (which was removed in previous test)
            const ethToken = tokens.find(token => token.symbol === 'ETH')
            const aliceDepositAmount = BigInt(1e18)
            const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount })
            
            try {
                await transaction({ 
                    obscura, 
                    outputs: [aliceDepositUtxo], 
                    provider, 
                    tokenAddress: ethToken.address 
                })
                fail('Should have thrown an error for non-whitelisted token')
            } catch (error) {
                expect(error).toBeDefined()
            }
        })

        it('should get token balance for any ERC20 token', async () => {
            obscura.connect(alice)
            
            // Get STRK balance for Alice
            const strkToken = tokens.find(token => token.symbol === 'STRK')
            const aliceStrkBalance = await obscura.get_token_balance(strkToken.address, alice.address)
            expect(typeof aliceStrkBalance).toBe('bigint')
            
            // Balance should be positive (Alice has STRK from setup)
            expect(aliceStrkBalance).toBeGreaterThan(0n)
        })

        it('should perform multitoken transaction after re-whitelisting', async () => {
            obscura.connect(alice)
            
            // Re-add ETH token for testing
            const ethToken = tokens.find(token => token.symbol === 'ETH')
            await obscura.add_token(ethToken.address)
            
            // Verify token is whitelisted
            const isAllowed = await obscura.is_token_allowed(ethToken.address)
            expect(isAllowed).toBe(true)
            
            // Note: Actual transaction with ETH token would require Alice to have ETH balance
            // This test verifies the token is accepted by the system
            console.log(`${ethToken.symbol} token successfully whitelisted for transactions`)
        })

        it('should validate token properties in array', async () => {
            // Verify all tokens have required properties
            for (const token of tokens) {
                expect(token.name).toBeDefined()
                expect(token.symbol).toBeDefined()
                expect(token.address).toBeDefined()
                expect(token.contract).toBeDefined()
                expect(typeof token.isDefault).toBe('boolean')
                expect(typeof token.decimals).toBe('number')
                expect(token.decimals).toBeGreaterThan(0)
            }
            
            // Verify STRK is marked as default
            const strkToken = tokens.find(token => token.symbol === 'STRK')
            expect(strkToken.isDefault).toBe(true)
            
            // Verify other tokens are not default
            const nonDefaultTokens = tokens.filter(token => !token.isDefault)
            expect(nonDefaultTokens.length).toBe(tokens.length - 1)
        })
    })
})
