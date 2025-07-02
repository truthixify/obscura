import { create } from 'zustand'

interface ModalStateState {
    isModalOpen: boolean
    setIsModalOpen: (status: boolean) => void
}

export const useModalStore = create<ModalStateState>(set => ({
    isModalOpen: false,

    setIsModalOpen: (status: boolean) => set({ isModalOpen: status })
}))
