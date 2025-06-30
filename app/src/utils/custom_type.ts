import { BigNumberish } from 'starknet'

export type U1024 = {
    limb0: string
    limb1: string
    limb2: string
    limb3: string
    limb4: string
    limb5: string
    limb6: string
    limb7: string
}

export type I256 = {
    value: number | string | BigNumberish
    is_negative: boolean
}

export function splitHexToU1024Limbs(hex: string): U1024 {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex

    if (cleanHex.length > 256) {
        throw new Error('Input exceeds 1024 bits')
    }

    const padded = cleanHex.padStart(256, '0') // 256 hex chars = 1024 bits
    const limbs: Partial<U1024> = {}

    for (let i = 0; i < 8; i++) {
        const chunk = padded.slice(i * 32, (i + 1) * 32) // 32 hex chars = 128 bits
        limbs[`limb${i}` as keyof U1024] = `0x${chunk}`
    }

    return limbs as U1024
}

export function u1024LimbsToHex(u1024: U1024): string {
    const hex = Object.keys(u1024)
        .sort((a, b) => parseInt(b.replace('limb', '')) - parseInt(a.replace('limb', '')))
        .map(key => {
            const limb = u1024[key as keyof U1024]
            return limb.startsWith('0x') ? limb.slice(2).padStart(32, '0') : limb.padStart(32, '0')
        })
        .join('')

    return '0x' + hex
}
