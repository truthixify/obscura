import { RpcProvider, Contract, Account, CallData, hash } from 'starknet'
import { getCompiledCode } from './utils'
import dotenv from 'dotenv'

dotenv.config()

interface MockTokenConfig {
    name: string
    symbol: string
    decimals: number
    initialSupply: bigint
}



/**
 * @notice Deploys mock ERC20 tokens for testing
 */
export async function deployMockTokens(): Promise<void> {
    const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL_DEVNET })
    const privateKey = process.env.PRIVATE_KEY_DEVNET
    const accountAddress = process.env.ACCOUNT_ADDRESS_DEVNET
    const account = new Account(provider, accountAddress!, privateKey!)

    const mockTokenConfigs: MockTokenConfig[] = [
        {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
            initialSupply: BigInt(10000) * BigInt(10 ** 18)
        },
        {
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            initialSupply: BigInt(10000) * BigInt(10 ** 6)
        },
        {
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            initialSupply: BigInt(10000) * BigInt(10 ** 6)
        }
    ]

    try {
        const { sierraCode: tokenSierraCode, casmCode: tokenCasmCode } = await getCompiledCode('token_Token')

        // Compute token contract class hash
        const classHash = hash.computeContractClassHash(tokenSierraCode)
        console.log(`🔍 Checking if token contract is already declared: ${classHash}`)

        try {
            await provider.getClassByHash(classHash)
            console.log(`✅ Token contract already declared with class hash: ${classHash}`)
        } catch (error) {
            // Contract not declared, declare it now
            console.log('📝 Declaring token contract...')
            try {
                const declareResponse = await account.declare({
                    contract: tokenSierraCode,
                    casm: tokenCasmCode
                })
                await provider.waitForTransaction(declareResponse.transaction_hash)
                console.log(`✅ Token contract declared with class hash: ${declareResponse.class_hash}`)
            } catch (declareError: any) {
                console.log(`⚠️  Token declaration failed: ${declareError.message?.slice(0, 100)}...`)
                console.log(`🔄 Continuing with computed class hash: ${classHash}`)
            }
        }

        console.log('Deploying mock ERC20 tokens...')

        for (const config of mockTokenConfigs) {
            const tokenCallData = new CallData(tokenSierraCode.abi)
            const constructorCalldata = tokenCallData.compile('constructor', {
                owner: account.address,
                name: config.name,
                symbol: config.symbol
            })

            const deployResponse = await account.deployContract({
                classHash,
                constructorCalldata
            })

            await provider.waitForTransaction(deployResponse.transaction_hash)

            const tokenContract = new Contract(tokenSierraCode.abi, deployResponse.address, provider)
            tokenContract.connect(account)

            // Mint initial supply
            if (config.initialSupply > 0n) {
                const mintTx = await tokenContract.mint(account.address, config.initialSupply)
                await provider.waitForTransaction(mintTx.transaction_hash)
                console.log(`Minted ${config.initialSupply} ${config.symbol} tokens`)
            }

            console.log(`✅ Deployed ${config.symbol} token at: ${deployResponse.address}`)
        }

        console.log('🎉 All mock tokens deployed successfully!')

    } catch (error) {
        console.error('❌ Failed to deploy mock tokens:', error)
        throw error
    }
}

// Run if called directly
if (require.main === module) {
    deployMockTokens()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}