import { create } from 'zustand'
import { Keypair } from '../utils/keypair'

interface KeypairState {
    keypair: Keypair | null
    setKeypair: (kp?: Keypair) => void
    reset: () => void
}

export const useKeypairStore = create<KeypairState>(set => ({
    keypair: null,

    setKeypair: (kp?: Keypair) => {
        const keypair = kp ?? new Keypair()
        set({ keypair })
    },

    reset: () =>
        set({
            keypair: null
        })
}))
