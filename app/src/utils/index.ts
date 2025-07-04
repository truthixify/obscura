import MerkleTree from 'fixed-merkle-tree'
import { toFixedHex, poseidonHash2, getExtDataHash, FIELD_SIZE, shuffle } from './utils'
import Utxo from './utxo'
import { prove } from './prover'
import { BigNumberish, RpcProvider, Contract, stark, CallData, Call } from 'starknet'
import { parseNewCommitEvent } from './events_parsing'

const MERKLE_TREE_HEIGHT = 28

export async function buildMerkleTree({
    obscura,
    provider
}: {
    obscura: Contract
    provider: RpcProvider
}): Promise<MerkleTree> {
    const parsedEvents = await parseNewCommitEvent(obscura, provider)

    const leaves = parsedEvents.map((e: any) => e.commitment.toString())

    return new MerkleTree(MERKLE_TREE_HEIGHT, leaves, { hashFunction: poseidonHash2 })
}

interface GetProofParams {
    inputs: any[]
    outputs: any[]
    tree: any
    extAmount: BigNumberish
    fee: number
    recipient: string | number
    relayer: string | number
}

export async function getProof({
    inputs,
    outputs,
    tree,
    extAmount,
    fee,
    recipient,
    relayer
}: GetProofParams): Promise<{ args: any; extData: any }> {
    inputs = shuffle(inputs)
    outputs = shuffle(outputs)

    const inputMerklePathIndices: number[] = []
    const inputMerklePathElements: any[] = []

    for (const input of inputs) {
        if (input.amount > 0) {
            input.index = tree.indexOf(input.getCommitment().toString())
            if (input.index < 0) {
                throw new Error(
                    `Input commitment ${input.getCommitment().toString()} was not found`
                )
            }
            inputMerklePathIndices.push(input.index)
            inputMerklePathElements.push(tree.path(input.index).pathElements)
        } else {
            inputMerklePathIndices.push(0)
            inputMerklePathElements.push(new Array(tree.levels).fill(0))
        }
    }

    const extData = {
        recipient: recipient.toString(),
        ext_amount: {
            value: BigInt(extAmount) < 0n ? -BigInt(extAmount) : BigInt(extAmount),
            is_negative: BigInt(extAmount) < 0n
        },
        relayer: relayer.toString(),
        fee: toFixedHex(fee),
        encrypted_output1: outputs[0].encrypt(),
        encrypted_output2: outputs[1].encrypt()
    }
    const extDataHash = getExtDataHash(extData)
    const input = {
        root: tree.root,
        input_nullifiers: inputs.map(x => x.getNullifier().toString()),
        output_commitment: outputs.map(x => x.getCommitment().toString()),
        public_amount: ((BigInt(extAmount) - BigInt(fee) + FIELD_SIZE) % FIELD_SIZE).toString(),
        ext_data_hash: extDataHash.toString(),
        in_amount: inputs.map(x => x.amount.toString()),
        in_private_key: inputs.map(x => (BigInt(x.keypair.privkey) % FIELD_SIZE).toString()),
        in_blinding: inputs.map(x => x.blinding.toString()),
        in_path_indices: inputMerklePathIndices,
        in_path_elements: inputMerklePathElements,
        out_amount: outputs.map(x => x.amount.toString()),
        out_blinding: outputs.map(x => x.blinding.toString()),
        out_pubkey: outputs.map(x => x.keypair.pubkey.toString())
    }

    const { callData } = await prove(input)

    const args = {
        proof: callData,
        root: toFixedHex(input.root),
        input_nullifiers: inputs.map(x => x.getNullifier().toString()),
        output_commitments: outputs.map(x => x.getCommitment().toString()),
        public_amount: toFixedHex(input.public_amount),
        ext_data_hash: toFixedHex(extDataHash)
    }

    return { extData, args }
}

interface PrepareTransactionParams {
    obscura: Contract
    provider: RpcProvider
    inputs?: any[]
    outputs?: any[]
    fee?: number
    recipient?: string | number
    relayer?: string | number
}

export async function prepareTransaction({
    obscura,
    provider,
    inputs = [],
    outputs = [],
    fee = 0,
    recipient = stark.randomAddress(),
    relayer = stark.randomAddress()
}: PrepareTransactionParams): Promise<{ args: any; extData: any }> {
    if (inputs.length > 16 || outputs.length > 2) {
        throw new Error('Incorrect inputs/outputs count')
    }
    while (inputs.length !== 2 && inputs.length < 16) {
        inputs.push(new Utxo())
    }
    while (outputs.length < 2) {
        outputs.push(new Utxo())
    }

    const extAmount =
        BigInt(fee) +
        outputs.reduce((sum, x) => sum + x.amount, BigInt(0)) -
        inputs.reduce((sum, x) => sum + x.amount, BigInt(0))

    const { args, extData } = await getProof({
        inputs,
        outputs,
        tree: await buildMerkleTree({ obscura, provider }),
        extAmount,
        fee,
        recipient,
        relayer
    })

    return { args, extData }
}

export async function transaction({
    obscura,
    provider,
    ...rest
}: {
    obscura: any
    [key: string]: any
}): Promise<any> {
    const { args, extData } = await prepareTransaction({
        obscura,
        provider,
        ...rest
    })

    const receipt = await obscura.transact(args, extData)

    return receipt
}

export async function registerAndTransact({
    obscura,
    provider,
    account,
    ...rest
}: {
    obscura: any
    account: any
    [key: string]: any
}): Promise<any> {
    const { args, extData } = await prepareTransaction({
        obscura,
        provider,
        ...rest
    })

    const receipt = await obscura.register_and_transact(account, args, extData)

    return receipt
}

export async function generateTransactionCall({
    obscura,
    provider,
    account,
    ...rest
}: {
    obscura: Contract
    account: any
    [key: string]: any
}): Promise<Call[]> {
    const contractCallData: CallData = new CallData(obscura.abi)

    const { args, extData } = await prepareTransaction({
        obscura,
        provider,
        ...rest
    })

    const calldata = contractCallData.compile('transact', [args, extData])

    const call: Call = {
        entrypoint: 'transact',
        contractAddress: obscura.address,
        calldata,
    }

    return [call]
}