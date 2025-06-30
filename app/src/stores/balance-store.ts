import { create } from 'zustand'

interface BalanceState {
    balance: string
    setBalance: (value: string) => void
}

export const useBalanceStore = create<BalanceState>(set => ({
    balance: '0',

    setBalance: (value: string) => set({ balance: value })
}))
