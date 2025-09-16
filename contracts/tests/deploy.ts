import { RpcProvider, Contract, Account, Calldata, CallData } from 'starknet'
import { getCompiledCode } from './utils'
import dotenv from 'dotenv'

dotenv.config()

/**
 * @notice Deploys the test contract.
 * @dev Deploys the test contract with the specified number of levels and maximum deposit amount.
 * @param levels The number of levels in the contract.
 * @param maximum_deposit_amount The maximum deposit amount in the contract.
 * @returns An object containing the deployed contract and the Starknet token contract.
 */
interface TokenInfo {
    name: string
    symbol: string
    address: string
    contract: Contract
    isDefault: boolean
    decimals: number
}

export const deployTestContract = async (
    levels: number,
    maximum_deposit_amount: bigint
): Promise<{ obscura: Contract; tokens: TokenInfo[] }> => {
    const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL_DEVNET })
    const privateKey = process.env.PRIVATE_KEY_DEVNET
    const accountAddress = process.env.ACCOUNT_ADDRESS_DEVNET
    const classHash = '0x43320c4e0711cdeedb0a2ab8af145b34b10ed6f369d04895e8f0eddc2f9b1a9' // Replace with your declared class hash
    const account = new Account(provider, accountAddress, privateKey)
    // All token addresses for testing multitoken functionality
    const tokenConfigs = [
        {
            name: 'Starknet Token',
            symbol: 'STRK',
            address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
            isDefault: true,
            decimals: 18
        },
        {
            name: 'Ethereum',
            symbol: 'ETH',
            address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            isDefault: false,
            decimals: 18
        },
        {
            name: 'USD Coin',
            symbol: 'USDC',
            address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
            isDefault: false,
            decimals: 6
        },
        {
            name: 'Tether USD',
            symbol: 'USDT',
            address: '0x061c54ec0285bc41ca6823c9a6758cb3555cb1d2479f3758dadd0f6f6a94c6bd',
            isDefault: false,
            decimals: 6
        },
        {
            name: 'Dai Stablecoin',
            symbol: 'DAI',
            address: '0x02de7e69dacb0702779ace0fe11e345cbd7125b267933aaad6fb7ac1d1739b0b',
            isDefault: false,
            decimals: 18
        }
    ]

    let sierraCode: any
    let tokenContracts: any[] = []

    try {
        ;({ sierraCode } = await getCompiledCode('obscura_Obscura'))
        
        // Get all token contracts
        for (const tokenConfig of tokenConfigs) {
            try {
                const tokenContract = await provider.getClassAt(tokenConfig.address)
                tokenContracts.push({ 
                    ...tokenConfig, 
                    abi: tokenContract.abi 
                })
            } catch (error) {
                console.log(`Warning: Could not load token at ${tokenConfig.address}, using fallback ABI`)
                // Use a basic ERC20 ABI as fallback
                tokenContracts.push({ 
                    ...tokenConfig, 
                    abi: [] // Will be populated with basic ERC20 ABI if needed
                })
            }
        }
    } catch (error: any) {
        console.log('Failed to read contract files')
        console.log(error)
        process.exit(1)
    }

    const contractCallData: CallData = new CallData(sierraCode.abi)
    const constructorCalldata: Calldata = contractCallData.compile('constructor', {
        levels,
        maximum_deposit_amount
    })

    try {
        const deployResponse = await account.deployContract({
            classHash,
            constructorCalldata
        })

        await provider.waitForTransaction(deployResponse.transaction_hash)

        const obscura = new Contract(sierraCode.abi, deployResponse.address, provider)
        
        // Create token info array with contract instances
        const tokens: TokenInfo[] = tokenContracts.map(tokenData => ({
            name: tokenData.name,
            symbol: tokenData.symbol,
            address: tokenData.address,
            contract: new Contract(tokenData.abi, tokenData.address, provider),
            isDefault: tokenData.isDefault,
            decimals: tokenData.decimals
        }))
        
        // Add default token (STRK) to whitelist
        obscura.connect(account)
        const defaultToken = tokens.find(token => token.isDefault)
        if (defaultToken) {
            try {
                await obscura.add_token(defaultToken.address)
                console.log(`${defaultToken.symbol} token added as default token to whitelist`)
            } catch (error) {
                console.log(`${defaultToken.symbol} token may already be whitelisted or error occurred:`, error)
            }
        }

        return { obscura, tokens }
    } catch (error) {
        console.log(error)
    }
}
