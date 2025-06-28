import { create } from 'zustand'

interface PlayerState {
    playerName: string
    setPlayerName: (playerName: string) => void
}

export const usePlayerStore = create<PlayerState>(set => ({
    playerName: '',
    setPlayerName: name => set({ playerName: name })
}))
