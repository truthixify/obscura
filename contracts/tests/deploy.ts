import { RpcProvider, Contract, Account, Calldata, CallData, hash } from 'starknet'
import { getCompiledCode } from './utils'
import dotenv from 'dotenv'

dotenv.config()

/**
 * @notice Deploys the test contract and mock ERC20 tokens.
 * @dev Deploys the test contract with the specified number of levels and maximum deposit amount.
 * @param levels The number of levels in the contract.
 * @param maximum_deposit_amount The maximum deposit amount in the contract.
 * @returns An object containing the deployed contract and token contracts.
 */
interface TokenInfo {
    name: string
    symbol: string
    address: string
    contract: Contract
    isDefault: boolean
    decimals: number
}

interface MockTokenConfig {
    name: string
    symbol: string
    decimals: number
    initialSupply: bigint
}



/**
 * @notice Deploys a mock ERC20 token using pre-declared class hash
 * @param provider RPC provider
 * @param account Account to deploy from
 * @param classHash Pre-declared class hash
 * @param tokenSierraCode Compiled token contract code (for ABI)
 * @param config Token configuration
 * @returns Deployed token contract
 */
async function deployMockToken(
    provider: RpcProvider,
    account: Account,
    classHash: string,
    tokenSierraCode: any,
    config: MockTokenConfig
): Promise<Contract> {
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

    // Mint initial supply to the deployer
    if (config.initialSupply > 0n) {
        const mintTx = await tokenContract.mint(account.address, config.initialSupply)
        await provider.waitForTransaction(mintTx.transaction_hash)
    }

    console.log(`✅ Deployed ${config.symbol} token at: ${deployResponse.address}`)
    return tokenContract
}

export const deployTestContract = async (
    levels: number,
    maximum_deposit_amount: bigint
): Promise<{ obscura: Contract; tokens: TokenInfo[] }> => {
    const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL_DEVNET })
    const privateKey = process.env.PRIVATE_KEY_DEVNET
    const accountAddress = process.env.ACCOUNT_ADDRESS_DEVNET
    const account = new Account(provider, accountAddress, privateKey)

    // Mock tokens to deploy for testing
    const mockTokenConfigs: MockTokenConfig[] = [
        {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
            initialSupply: BigInt(10000) * BigInt(10 ** 18) // 10K tokens
        },
        {
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            initialSupply: BigInt(10000) * BigInt(10 ** 6) // 10K tokens
        },
        {
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            initialSupply: BigInt(10000) * BigInt(10 ** 6) // 10K tokens
        }
    ]

    let sierraCode: any
    let casmCode: any
    let tokenSierraCode: any
    let tokenCasmCode: any
    let verifierSierraCode: any
    let verifierCasmCode: any
    let deployedTokens: TokenInfo[] = []

    try {
        ; ({ sierraCode, casmCode } = await getCompiledCode('obscura_Obscura'))
            ; ({ sierraCode: tokenSierraCode, casmCode: tokenCasmCode } = await getCompiledCode('token_Token'))
            ; ({ sierraCode: verifierSierraCode, casmCode: verifierCasmCode } = await getCompiledCode('verifier_UltraStarknetHonkVerifier'))

        // Declare verifier contract first
        console.log('🔐 Declaring verifier contract...')
        const verifierClassHash = hash.computeContractClassHash(verifierSierraCode)
        console.log(`🔍 Checking if verifier contract is already declared: ${verifierClassHash}`)

        try {
            await provider.getClassByHash(verifierClassHash)
            console.log(`✅ Verifier contract already declared with class hash: ${verifierClassHash}`)
        } catch (error) {
            // Contract not declared, declare it now
            console.log('📝 Declaring verifier contract...')
            try {
                const declareResponse = await account.declare({
                    contract: verifierSierraCode,
                    casm: verifierCasmCode
                })
                await provider.waitForTransaction(declareResponse.transaction_hash)
                console.log(`✅ Verifier contract declared with class hash: ${declareResponse.class_hash}`)
            } catch (declareError: any) {
                console.log(`⚠️  Verifier declaration failed: ${declareError.message?.slice(0, 100)}...`)
                console.log(`🔄 Continuing with computed class hash: ${verifierClassHash}`)
            }
        }

        console.log('🚀 Deploying mock ERC20 tokens...')

        // Compute token contract class hash
        const tokenClassHash = hash.computeContractClassHash(tokenSierraCode)
        console.log(`🔍 Checking if token contract is already declared: ${tokenClassHash}`)

        try {
            await provider.getClassByHash(tokenClassHash)
            console.log(`✅ Token contract already declared with class hash: ${tokenClassHash}`)
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
                console.log(`🔄 Continuing with computed class hash: ${tokenClassHash}`)
            }
        }

        // Deploy mock tokens using the same class hash
        for (const config of mockTokenConfigs) {
            const tokenContract = await deployMockToken(provider, account, tokenClassHash, tokenSierraCode, config)
            deployedTokens.push({
                name: config.name,
                symbol: config.symbol,
                address: tokenContract.address,
                contract: tokenContract,
                isDefault: false,
                decimals: config.decimals
            })
        }

        // Add STRK token (pre-deployed on devnet)
        const strkTokenConfig = {
            name: 'Starknet Token',
            symbol: 'STRK',
            address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
            isDefault: true,
            decimals: 18
        }

        try {
            const strkTokenClass = await provider.getClassAt(strkTokenConfig.address)
            const strkContract = new Contract(strkTokenClass.abi, strkTokenConfig.address, provider)
            deployedTokens.unshift({
                ...strkTokenConfig,
                contract: strkContract
            })
            console.log('Added STRK token from devnet')
        } catch (error) {
            console.log('Warning: Could not load STRK token, using fallback')
            deployedTokens.unshift({
                ...strkTokenConfig,
                contract: new Contract([], strkTokenConfig.address, provider)
            })
        }

    } catch (error: any) {
        console.log('Failed to read contract files')
        console.log(error)
        process.exit(1)
    }

    const contractCallData: CallData = new CallData(sierraCode.abi)
    const constructorCalldata: Calldata = contractCallData.compile('constructor', {
        levels,
        maximum_deposit_amount,
        owner: accountAddress
    })

    // Compute Obscura contract class hash
    const obscuraClassHash = hash.computeContractClassHash(sierraCode)
    console.log(`🔍 Checking if Obscura contract is already declared: ${obscuraClassHash}`)

    try {
        await provider.getClassByHash(obscuraClassHash)
        console.log(`✅ Obscura contract already declared with class hash: ${obscuraClassHash}`)
    } catch (error) {
        // Contract not declared, declare it now
        console.log('📝 Declaring Obscura contract...')
        try {
            const declareResponse = await account.declare({
                contract: sierraCode,
                casm: casmCode
            })
            await provider.waitForTransaction(declareResponse.transaction_hash)
            console.log(`✅ Obscura contract declared with class hash: ${declareResponse.class_hash}`)
        } catch (declareError: any) {
            console.log(`⚠️  Obscura declaration failed: ${declareError.message?.slice(0, 100)}...`)
            console.log(`🔄 Continuing with computed class hash: ${obscuraClassHash}`)
        }
    }

    try {
        console.log('🏗️  Deploying Obscura contract...')
        const deployResponse = await account.deployContract({
            classHash: obscuraClassHash,
            constructorCalldata
        })

        await provider.waitForTransaction(deployResponse.transaction_hash)
        console.log(`✅ Obscura contract deployed at: ${deployResponse.address}`)

        const obscura = new Contract(sierraCode.abi, deployResponse.address, provider)
        obscura.connect(account)

        console.log('⚙️  Obscura contract ready for testing')

        console.log(`🎉 Deployment complete! Obscura: ${deployResponse.address}, Tokens: ${deployedTokens.length}`)
        return { obscura, tokens: deployedTokens }
    } catch (error) {
        console.log('Deployment failed:', error)
        throw error
    }
}
