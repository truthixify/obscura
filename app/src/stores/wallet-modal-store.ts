import { create } from 'zustand'

interface WalletModalStateState {
    isWalletModalOpen: boolean
    setIsWalletModalOpen: (status: boolean) => void
}

export const useWalletModalStore = create<WalletModalStateState>(set => ({
    isWalletModalOpen: false,

    setIsWalletModalOpen: (status: boolean) => set({ isWalletModalOpen: status }),
}))
