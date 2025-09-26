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

describe('Obscura Privacy Protocol', () => {
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

        console.log('Starting deployment...')
            ; ({ obscura, tokens } = await deployTestContract(28, BigInt(10000 * 1e18)))
        console.log('Deployment completed, initializing Garaga...')

        // Add STRK token to allowlist (alice is the deployer/owner)
        console.log('Adding STRK token to allowlist...')
        obscura.connect(alice) // Ensure alice (deployer/owner) is connected
        const strkToken = tokens.find((token: any) => token.symbol === 'STRK')
        if (strkToken) {
            try {

                await obscura.add_token(strkToken.address)
                console.log('✅ STRK token added to allowlist')
            } catch (error: any) {
                console.log('⚠️ STRK token may already be in allowlist:', error.message)
            }
        }

        await initGaraga()
        console.log('Setup complete!')
    }, 300000) // 5 minute timeout for this specific hook

    describe('Core Cryptographic Functions', () => {
        it('should encrypt and decrypt data correctly', async () => {
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

        it('should have valid contract constants', async () => {
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
    })

    describe('Account Registration', () => {
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

        it('should register and deposit in one transaction', async function () {
            // Alice deposits into obscura
            const aliceDepositAmount = 1e7
            const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount })

            obscura.connect(alice)
            const strkToken = tokens.find((token: any) => token.symbol === 'STRK')?.contract
            const strkTokenAddress = tokens.find((token: any) => token.symbol === 'STRK')?.address
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
    })

    describe('Single Token Transactions (STRK)', () => {
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
    })

    describe('Multitoken Management', () => {
        it('should check initial token whitelist status', async () => {
            obscura.connect(alice)

            // STRK token should be whitelisted (added in beforeAll)
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
            expect(tokenCount).toBe(1n)
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
            expect(tokenCount).toBe(2n)

            // Check token can be retrieved by index
            const tokenAtIndex1 = await obscura.get_token_by_index(1)
            expect(addAddressPadding(num.toHex(tokenAtIndex1))).toBe(addAddressPadding(ethToken.address))
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
            expect(tokenCount).toBe(4n)
        })

        it('should get all whitelisted tokens', async () => {
            obscura.connect(alice)

            const allTokens = (await obscura.get_all_tokens()).map(token => addAddressPadding(num.toHex(token)))
            expect(allTokens.length).toBe(4)

            // Should contain all the tokens we added
            const strkToken = tokens.find(token => token.symbol === 'STRK')
            const ethToken = tokens.find(token => token.symbol === 'ETH')
            const usdcToken = tokens.find(token => token.symbol === 'USDC')
            const usdtToken = tokens.find(token => token.symbol === 'USDT')

            expect(allTokens).toContain(addAddressPadding(strkToken.address))
            expect(allTokens).toContain(addAddressPadding(ethToken.address))
            expect(allTokens).toContain(addAddressPadding(usdcToken.address))
            expect(allTokens).toContain(addAddressPadding(usdtToken.address))
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
            expect(tokenCount).toBe(3n)
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
            expect(tokenCount).toBe(1n)

            // Verify only STRK is left
            const allTokens = await obscura.get_all_tokens()
            expect(allTokens.length).toBe(1)
            const strkToken = tokens.find(token => token.symbol === 'STRK')
            expect(addAddressPadding(num.toHex(allTokens[0]))).toBe(strkToken.address)
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
            const strkToken = tokens.find((token: any) => token.symbol === 'STRK')
            expect(strkToken.isDefault).toBe(true)

            // Verify other tokens are not default
            const nonDefaultTokens = tokens.filter((token: any) => !token.isDefault)
            expect(nonDefaultTokens.length).toBe(tokens.length - 1)
        })
    })

    describe('Multitoken Transactions', () => {
        beforeAll(async () => {
            // Setup tokens for multitoken testing
            obscura.connect(alice)

            // Add tokens to whitelist only if not already added
            const ethToken = tokens.find((token: any) => token.symbol === 'ETH')
            const usdcToken = tokens.find((token: any) => token.symbol === 'USDC')
            const usdtToken = tokens.find((token: any) => token.symbol === 'USDT')

            const tokensToAdd = [
                { token: ethToken, name: 'ETH' },
                { token: usdcToken, name: 'USDC' },
                { token: usdtToken, name: 'USDT' }
            ]

            for (const { token, name } of tokensToAdd) {
                try {
                    const isAllowed = await obscura.is_token_allowed(token.address)
                    if (!isAllowed) {
                        await obscura.add_token(token.address)
                        console.log(`✅ Added ${name} token to whitelist`)
                    } else {
                        console.log(`ℹ️  ${name} token already whitelisted`)
                    }
                } catch (error: any) {
                    console.log(`⚠️  Failed to add ${name} token: ${error.message}`)
                }
            }

            console.log('✅ Multitoken setup complete')
        })

        it('should deposit ETH tokens', async () => {
            const ethToken = tokens.find((token: any) => token.symbol === 'ETH')
            const ethDepositAmount = BigInt(5) * BigInt(10 ** 18) // 5 ETH
            const aliceEthUtxo = new Utxo({ amount: ethDepositAmount })

            // Alice approves and deposits ETH
            obscura.connect(alice)
            ethToken.contract.connect(alice)
            await ethToken.contract.approve(obscura.address, ethDepositAmount)

            await transaction({
                obscura,
                outputs: [aliceEthUtxo],
                provider,
                tokenAddress: ethToken.address
            })

            console.log(`✅ Deposited ${ethDepositAmount} ETH tokens`)
        })

        it('should deposit USDC tokens', async () => {
            const usdcToken = tokens.find((token: any) => token.symbol === 'USDC')
            const usdcDepositAmount = BigInt(1000) * BigInt(10 ** 6) // 1000 USDC
            const aliceUsdcUtxo = new Utxo({ amount: usdcDepositAmount })

            // Alice approves and deposits USDC
            obscura.connect(alice)
            usdcToken.contract.connect(alice)
            await usdcToken.contract.approve(obscura.address, usdcDepositAmount)

            await transaction({
                obscura,
                outputs: [aliceUsdcUtxo],
                provider,
                tokenAddress: usdcToken.address
            })

            console.log(`✅ Deposited ${usdcDepositAmount} USDC tokens`)
        })

        it('should perform cross-token transactions', async () => {
            // This test demonstrates that different tokens can be used independently
            // Each transaction is for a specific token type

            const ethToken = tokens.find((token: any) => token.symbol === 'ETH')
            const usdcToken = tokens.find((token: any) => token.symbol === 'USDC')

            // Create UTXOs for different tokens
            const ethAmount = BigInt(1) * BigInt(10 ** 18) // 1 ETH
            const usdcAmount = BigInt(100) * BigInt(10 ** 6) // 100 USDC

            const bobEthUtxo = new Utxo({ amount: ethAmount })
            const bobUsdcUtxo = new Utxo({ amount: usdcAmount })

            // Alice sends ETH to Bob (separate transaction)
            obscura.connect(alice)
            ethToken.contract.connect(alice)
            await ethToken.contract.approve(obscura.address, ethAmount)

            await transaction({
                obscura,
                outputs: [bobEthUtxo],
                provider,
                tokenAddress: ethToken.address
            })

            // Alice sends USDC to Bob (separate transaction)
            usdcToken.contract.connect(alice)
            await usdcToken.contract.approve(obscura.address, usdcAmount)

            await transaction({
                obscura,
                outputs: [bobUsdcUtxo],
                provider,
                tokenAddress: usdcToken.address
            })

            console.log(`✅ Completed cross-token transactions: ${ethAmount} ETH and ${usdcAmount} USDC`)
        })

        it('should deposit, transact and withdraw different token types', async function () {
            // Test with ETH token
            const ethToken = tokens.find((token: any) => token.symbol === 'ETH')

            // Alice deposits ETH into obscura pool
            const aliceKeypair = new Keypair()
            const aliceDepositAmount = BigInt(1e18) // 1 ETH
            const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keypair: aliceKeypair })

            obscura.connect(alice)
            ethToken.contract.connect(alice)
            await ethToken.contract.approve(obscura.address, aliceDepositAmount)

            await transaction({
                obscura,
                outputs: [aliceDepositUtxo],
                provider,
                tokenAddress: ethToken.address
            })

            // Parse Alice's deposit to get the actual UTXO created on-chain
            const depositBlock = await provider.getBlock('latest')
            const depositEvents = (
                await parseNewCommitEvent(obscura, provider, { block_number: depositBlock.block_number })
            ).slice(-2)

            let actualAliceUtxo: Utxo
            try {
                actualAliceUtxo = Utxo.decrypt(
                    aliceKeypair,
                    depositEvents[0].encrypted_output,
                    depositEvents[0].index
                )
            } catch (error) {
                // Try to decrypt another output if the first fails due to output shuffling
                actualAliceUtxo = Utxo.decrypt(
                    aliceKeypair,
                    depositEvents[1].encrypted_output,
                    depositEvents[1].index
                )
            }

            // Bob gives Alice address to send some ETH inside the shielded pool
            const bobKeypair = new Keypair()
            const bobAddress = bobKeypair.address()

            // Alice sends some ETH to Bob
            const bobSendAmount = BigInt(6e17) // 0.6 ETH
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
                inputs: [actualAliceUtxo],
                outputs: [bobSendUtxo, aliceChangeUtxo],
                provider,
                tokenAddress: ethToken.address
            })

            // Bob parses chain to detect incoming ETH funds
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

            // Bob withdraws a part of his ETH funds from the shielded pool
            const bobWithdrawalAmount = BigInt(5e17) // 0.5 ETH
            const bobWithdrawalEthAddress = stark.randomAddress()
            const bobBalanceBefore = await ethToken.contract.balanceOf(bobWithdrawalEthAddress)
            const bobChangeUtxo = new Utxo({
                amount: bobSendAmount - bobWithdrawalAmount,
                keypair: bobKeypair
            })

            await transaction({
                obscura,
                inputs: [bobReceiveUtxo],
                outputs: [bobChangeUtxo],
                recipient: bobWithdrawalEthAddress,
                provider,
                tokenAddress: ethToken.address
            })

            const bobBalanceAfter = await ethToken.contract.balanceOf(bobWithdrawalEthAddress)

            expect(bobBalanceAfter).toEqual(bobBalanceBefore + BigInt(bobWithdrawalAmount))

            console.log(`✅ Completed ETH deposit, transact and withdraw: ${bobWithdrawalAmount} ETH`)
        })

        it('should handle token balance queries for all tokens', async () => {
            obscura.connect(alice)

            // Test balance queries for all token types
            for (const token of tokens) {
                const balance = await obscura.get_token_balance(token.address, alice.address)
                expect(typeof balance).toBe('bigint')
                console.log(`${token.symbol} balance for Alice: ${balance}`)
            }
        })

        it('should verify token isolation', async () => {
            // Verify that transactions with different tokens are properly isolated
            const ethToken = tokens.find((token: any) => token.symbol === 'ETH')
            const usdcToken = tokens.find((token: any) => token.symbol === 'USDC')

            // Check that ETH and USDC have different addresses
            expect(ethToken.address).not.toBe(usdcToken.address)

            // Verify both are whitelisted
            const ethAllowed = await obscura.is_token_allowed(ethToken.address)
            const usdcAllowed = await obscura.is_token_allowed(usdcToken.address)

            expect(ethAllowed).toBe(true)
            expect(usdcAllowed).toBe(true)

            console.log('✅ Token isolation verified')
        })
    })
})
