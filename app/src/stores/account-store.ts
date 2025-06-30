import { create } from 'zustand'

interface AccountState {
    address: string | null
    owner: string | null
    isRegistered: boolean

    setAddress: (address: string) => void
    setOwner: (owner: string) => void
    setIsRegistered: (status: boolean) => void
    reset: () => void
}

export const useAccountStore = create<AccountState>(set => ({
    address: null,
    owner: null,
    isRegistered: false,

    setAddress: address => set({ address }),
    setOwner: owner => set({ owner }),
    setIsRegistered: status => set({ isRegistered: status }),

    reset: () =>
        set({
            address: null,
            owner: null,
            isRegistered: false
        })
}))
