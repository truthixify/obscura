import { getHonkCallData, init as initGaraga } from 'garaga'
import { bytecode, abi } from '../assets/circuit.json'
import vKeyUrl from '../assets/vk.bin?url'
import { flattenFieldsAsArray } from './helper'
import { UltraHonkBackend } from '@aztec/bb.js'
import { Noir } from '@noir-lang/noir_js'

export async function prove(input: any) {
    await initGaraga()

    // Load verifying key
    const response = await fetch(vKeyUrl)
    const arrayBuffer = await response.arrayBuffer()
    const vKey = new Uint8Array(arrayBuffer)

    // Generate Witness
    const noir = new Noir({ bytecode, abi: abi as any })
    console.log(input)
    const execResult = await noir.execute(input)
    // console.log('Witness Generated:', execResult)

    // Generate Proof
    const honk = new UltraHonkBackend(bytecode, { threads: 2 })
    const proof = await honk.generateProof(execResult.witness, {
        starknet: true
    })
    honk.destroy()
    // console.log('Proof Generated:', proof)

    // Prepare Calldata
    const callData = getHonkCallData(
        proof.proof,
        flattenFieldsAsArray(proof.publicInputs),
        vKey,
        1 // HonkFlavor.STARKNET
    )
    // console.log('Calldata Prepared:', callData)

    return {
        execResult,
        proof,
        callData
    }
}
