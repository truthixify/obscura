import { create } from 'zustand'

interface GameState {
    gameId?: number
    setGameId: (id: number) => void
}

export const useGameStore = create<GameState>(set => ({
    gameId: undefined,
    setGameId: id => set({ gameId: id })
}))
