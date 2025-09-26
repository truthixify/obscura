import { useState, useEffect } from 'react'
import { useScaffoldContract } from './scaffold-stark/useScaffoldContract'
import { useAccount } from '@starknet-react/core'
import { addAddressPadding, Contract, RpcProvider } from 'starknet'
import { parseNewCommitEvent } from '../utils/events_parsing'
import { useKeypairStore } from '../stores/keypair-store'
import Utxo from '../utils/utxo'
import { feltToString } from '../utils/utils'
import { feltToHex } from '../utils/scaffold-stark/common'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
}

interface ShieldedBalance {
  token: Token
  balance: bigint
  utxos: Utxo[]
}

export function useShieldedBalances() {
  const [balances, setBalances] = useState<ShieldedBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: obscura } = useScaffoldContract({ contractName: 'Obscura' })
  const { data: strk } = useScaffoldContract({ contractName: 'Strk' })
  const { address } = useAccount()
  const { keypair } = useKeypairStore()

  const calculateShieldedBalances = async () => {
    if (!obscura || !address || !keypair) return

    try {
      setLoading(true)
      setError(null)
      
      // Get all whitelisted tokens
      const tokenAddresses = (await obscura.get_all_tokens()).map((addr: any) => addAddressPadding(feltToHex(addr)))
      const shieldedBalances: ShieldedBalance[] = []

      // Add STRK as the first token (default)
      if (strk?.address) {
        const strkBalance = await calculateTokenShieldedBalance(strk.address, 'STRK', 'Starknet Token', 18)
        if (strkBalance && strkBalance.balance && strkBalance.balance > 0n) {
          shieldedBalances.push(strkBalance)
        }
      }

      // Calculate balances for other tokens
      for (const tokenAddress of tokenAddresses) {
        if (tokenAddress === strk?.address) continue // Skip STRK as it's already added
        
          // Create a contract instance for each token to get symbol and name
          const tokenContract = new Contract(
            [
              {
                "type": "function",
                "name": "symbol",
                "inputs": [],
                "outputs": [{"type": "core::felt252"}],
                "state_mutability": "view"
              },
              {
                "type": "function",
                "name": "name",
                "inputs": [],
                "outputs": [{"type": "core::felt252"}],
                "state_mutability": "view"
              },
              {
                "type": "function",
                "name": "decimals",
                "inputs": [],
                "outputs": [{"type": "core::integer::u8"}],
                "state_mutability": "view"
              }
            ],
            tokenAddress,
            obscura.providerOrAccount
          )

          const [symbol, name, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.name(),
            tokenContract.decimals()
          ])

          const tokenBalance = await calculateTokenShieldedBalance(
            tokenAddress,
            feltToString(symbol),
            feltToString(name),
            Number(decimals)
          )

          if (tokenBalance && tokenAddress && tokenBalance.balance && tokenBalance.balance > 0n) {
            shieldedBalances.push(tokenBalance)
          }
      }

      setBalances(shieldedBalances)
    } catch (error) {
      console.error('Failed to calculate shielded balances:', error)
      setError('Failed to load shielded balances')
    } finally {
      setLoading(false)
    }
  }

  const calculateTokenShieldedBalance = async (
    tokenAddress: string,
    symbol: string,
    name: string,
    decimals: number
  ): Promise<ShieldedBalance | null> => {
    try {
      // Get all commitment events for this token
      const commitmentEvents = await parseNewCommitEvent(
        obscura,
        obscura.providerOrAccount as RpcProvider,
        undefined,
        undefined,
        tokenAddress
      )

      if (!commitmentEvents) return null

      const utxos: Utxo[] = []
      let totalBalance = 0n


        const tryDecryptUtxo = (i: number): Utxo | undefined => {
            try {
                return Utxo.decrypt(
                    keypair,
                    commitmentEvents[i].encrypted_output,
                    commitmentEvents[i].index
                )
            } catch {
                try {
                    return Utxo.decrypt(
                        keypair,
                        commitmentEvents[i + 1].encrypted_output,
                        commitmentEvents[i + 1].index
                    )
                } catch {
                    return undefined
                }
            }
        }

        for (let i = 0; i < commitmentEvents.length; i += 2) {
            const utxo = tryDecryptUtxo(i)
            if (!utxo) continue

            const nullifier = utxo.getNullifier()
            const isSpent = await obscura.is_spent(nullifier)

            if (!isSpent && addAddressPadding(feltToHex(commitmentEvents[i].token_address)) === tokenAddress) {
                totalBalance += BigInt(utxo.amount)
                utxos.push(utxo);
            }
        }

      return {
        token: {
          address: tokenAddress,
          symbol,
          name,
          decimals
        },
        balance: totalBalance,
        utxos
      }
    } catch (error) {
      console.error(`Failed to calculate balance for token ${tokenAddress}:`, error)
      return null
    }
  }

  useEffect(() => {
    calculateShieldedBalances()
  }, [obscura, strk, address, keypair])

  const refreshBalances = () => {
    calculateShieldedBalances()
  }

  const getTokenBalance = (tokenAddress: string): bigint => {
    const tokenBalance = balances.find(b => b.token.address === tokenAddress)
    return tokenBalance?.balance || 0n
  }

  const getTokenUtxos = (tokenAddress: string): Utxo[] => {
    const tokenBalance = balances.find(b => b.token.address === tokenAddress)
    return tokenBalance?.utxos || []
  }

  const getTotalBalance = (): bigint => {
    return balances.reduce((total, balance) => total + balance.balance, 0n)
  }

  return {
    balances,
    loading,
    error,
    refreshBalances,
    getTokenBalance,
    getTokenUtxos,
    getTotalBalance
  }
}