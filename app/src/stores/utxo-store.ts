import { create } from 'zustand'
import Utxo from '../utils/utxo'

// Zustand store type
interface UtxoStore {
    utxos: Utxo[] | null
    setUtxos: (utxos: Utxo[] | null) => void
}

// Create the store
export const useUtxoStore = create<UtxoStore>(set => ({
    utxos: null,
    setUtxos: utxos => set({ utxos })
}))
