import { BigNumberish } from 'starknet'

export type HBNum = { hit: number; blow: number }

export type UppercaseLetter =
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G'
    | 'H'
    | 'I'
    | 'J'
    | 'K'
    | 'L'
    | 'M'
    | 'N'
    | 'O'
    | 'P'
    | 'Q'
    | 'R'
    | 'S'
    | 'T'
    | 'U'
    | 'V'
    | 'W'
    | 'X'
    | 'Y'
    | 'Z'

export type FourLetters = [UppercaseLetter, UppercaseLetter, UppercaseLetter, UppercaseLetter]

export type ProofInput = {
    guess: [number, number, number, number]
    solution: [number, number, number, number]
    numHit: number
    numBlow: number
    solutionnHash: BigNumberish
    salt: BigNumberish
}

// export type SolidityProof = {
//   a: [BigNumberish, BigNumberish];
//   b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
//   c: [BigNumberish, BigNumberish];
//   input: [
//     BigNumberish,
//     BigNumberish,
//     BigNumberish,
//     BigNumberish,
//     BigNumberish,
//     BigNumberish,
//     BigNumberish,
//     BigNumberish
//   ];
// };
