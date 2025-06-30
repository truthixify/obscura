import { create } from 'zustand'

interface BalanceState {
    balance: number
    setBalance: (value: number) => void
    isLoadingBalance: boolean
    setIsLoadingBalance: (value: boolean) => void
}

export const useBalanceStore = create<BalanceState>(set => ({
    balance: 0,

    setBalance: (value: number) => set({ balance: value }),

    isLoadingBalance: true,

    setIsLoadingBalance: (value: boolean) => set({ isLoadingBalance: value })
}))
