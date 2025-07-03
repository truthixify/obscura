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
export const deployTestContract = async (
    levels: number,
    maximum_deposit_amount: bigint
): Promise<{ obscura: Contract; strkToken: Contract }> => {
    const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL_DEVNET })
    const privateKey = process.env.PRIVATE_KEY_DEVNET
    const accountAddress = process.env.ACCOUNT_ADDRESS_DEVNET
    const classHash = '0x010276a33673c122f4d43b294813633bdb3ed7fda6ab9f888801851a8604fb49' // Replace with your declared class hash
    const account = new Account(provider, accountAddress, privateKey)
    const strkTokenAddress = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d' // Starknet token address

    let sierraCode: any
    let strkTokenCompressedContract: any

    try {
        ;({ sierraCode } = await getCompiledCode('obscura_Obscura'))
        strkTokenCompressedContract = await provider.getClassAt(strkTokenAddress)
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
        const strkToken = new Contract(strkTokenCompressedContract.abi, strkTokenAddress, provider)

        return { obscura, strkToken }
    } catch (error) {
        console.log(error)
    }
}
