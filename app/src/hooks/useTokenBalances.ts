import { useState, useEffect } from 'react'
import { useScaffoldContract } from './scaffold-stark/useScaffoldContract'
import { useAccount } from '@starknet-react/core'
import { addAddressPadding, Contract } from 'starknet'
import { feltToHex } from '../utils/scaffold-stark/common'
import { feltToString } from '../utils/utils'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  balance: bigint
}

export function useTokenBalances() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: obscura } = useScaffoldContract({ contractName: 'Obscura' })
  const { data: strk } = useScaffoldContract({ contractName: 'Strk' })
  const { address } = useAccount()

  const refreshBalances = async () => {
    if (!obscura || !address) return

    try {
      setLoading(true)
      setError(null)
      
      // Get all whitelisted tokens from the contract
      const tokenAddresses = (await obscura.get_all_tokens()).map((addr: any) => addAddressPadding(feltToHex(addr)))
      const tokenList: Token[] = []

      // Add STRK as the first token (default)
      if (strk?.address) {
        const strkBalance = await strk.balance_of(address)
        tokenList.push({
          address: strk.address,
          symbol: 'STRK',
          name: 'Starknet Token',
          decimals: 18,
          balance: strkBalance
        })
      }

      // Load other tokens
      for (const tokenAddress of tokenAddresses) {
        if (tokenAddress === strk?.address) continue // Skip STRK as it's already added
        
          // Create a contract instance for each token to get symbol and balance
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
              },
              {
                "type": "function",
                "name": "balance_of",
                "inputs": [{"name": "account", "type": "core::starknet::contract_address::ContractAddress"}],
                "outputs": [{"type": "core::integer::u256"}],
                "state_mutability": "view"
              }
            ],
            tokenAddress,
            obscura.providerOrAccount
          )

          const [symbol, name, decimals, balance] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.name(),
            tokenContract.decimals(),
            tokenContract.balance_of(address)
          ])

          tokenList.push({
            address: tokenAddress,
            symbol: feltToString(symbol),
            name: feltToString(name),
            decimals: Number(decimals),
            balance: balance
          });
      }

      setTokens(tokenList)
    } catch (error) {
      console.error('Failed to load tokens:', error)
      setError('Failed to load token balances')
      
      // Fallback to STRK only
      if (strk?.address) {
        try {
          const strkBalance = await strk.balance_of(address)
          setTokens([{
            address: strk.address,
            symbol: 'STRK',
            name: 'Starknet Token',
            decimals: 18,
            balance: strkBalance
          }])
        } catch (strkError) {
          console.error('Failed to load STRK balance:', strkError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshBalances()
  }, [obscura, strk, address])

  return {
    tokens,
    loading,
    error,
    refreshBalances
  }
}