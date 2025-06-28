import { getHonkCallData } from 'garaga'
import { bytecode, abi } from '../contracts/assets/circuit.json'
import { flattenFieldsAsArray } from './helper'
import { UltraHonkBackend } from '@aztec/bb.js'
import { Noir } from '@noir-lang/noir_js'
import fs from 'fs'

export async function prove(input: any, keyBasePath: any, env: 'web' | 'node' = 'web') {
    let vKeyNode: any

    // Load verifying key
    if (env == 'web') {
    } else {
        const vkData = fs.readFileSync(keyBasePath)
        vKeyNode = new Uint8Array(vkData)
    }

    // Generate Witness
    const noir = new Noir({ bytecode, abi: abi as any })
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
        vKeyNode,
        1 // HonkFlavor.STARKNET
    )
    // console.log('Calldata Prepared:', callData)

    return {
        execResult,
        proof,
        callData
    }
}
