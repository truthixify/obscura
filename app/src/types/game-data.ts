import { Uint256 } from 'starknet'

export type GameData = {
    solution: bigint[]
    salt: Uint256
    gameId: number | undefined
}
