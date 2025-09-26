import { useState, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from './button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '../../lib/utils'
import { useScaffoldContract } from '../../hooks/scaffold-stark/useScaffoldContract'
import { useAccount } from '@starknet-react/core'
import { addAddressPadding, Contract } from 'starknet'
import { useTheme } from '../../contexts/ThemeContext'
import { feltToHex } from '../../utils/scaffold-stark/common'
import { feltToString } from '../../utils/utils'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  balance?: bigint
}

interface TokenSelectorProps {
  selectedToken: Token | null
  onTokenSelect: (token: Token) => void
  className?: string
}

export function TokenSelector({ selectedToken, onTokenSelect, className }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  
  const { isDarkMode } = useTheme()
  const { data: obscura } = useScaffoldContract({ contractName: 'Obscura' })
  const { data: strk } = useScaffoldContract({ contractName: 'Strk' })
  const { address } = useAccount()

  // Default STRK token configuration
  const defaultStrkToken: Token = {
    address: strk?.address || '',
    symbol: 'STRK',
    name: 'Starknet Token',
    decimals: 18
  }

  useEffect(() => {
    const loadTokens = async () => {
      if (!obscura || !address) return

      try {
        setLoading(true)
        
        // Get all whitelisted tokens from the contract
        const tokenAddresses = (await obscura.get_all_tokens()).map((addr: any) => addAddressPadding(feltToHex(addr)))
        const tokenList: Token[] = []

        // Add STRK as the first token (default)
        if (strk?.address) {
          const strkBalance = await strk.balance_of(address)
          tokenList.push({
            ...defaultStrkToken,
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
            })
        }

        setTokens(tokenList)
        
        // Set STRK as default if no token is selected
        if (!selectedToken && tokenList.length > 0) {
          onTokenSelect(tokenList[0])
        }
      } catch (error) {
        console.error('Failed to load tokens:', error)
        // Fallback to STRK only
        if (strk?.address) {
          const strkBalance = await strk.balance_of(address)
          const fallbackTokens = [{
            ...defaultStrkToken,
            balance: strkBalance
          }]
          setTokens(fallbackTokens)
          if (!selectedToken) {
            onTokenSelect(fallbackTokens[0])
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadTokens()
  }, [obscura, strk, address, selectedToken, onTokenSelect])

  const formatBalance = (balance: bigint, decimals: number): string => {
  if (decimals < 2) throw new Error("Need at least 2 decimals to format");

  // scale down to two decimals
  const scaled = Number(balance) / 10 ** decimals;
  return scaled.toFixed(2);
};

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between backdrop-blur-sm border transition-colors duration-200",
            isDarkMode
              ? "bg-black/20 border-white/20 text-white hover:bg-black/30"
              : "bg-white/20 border-black/20 text-black hover:bg-white/30",
            className
          )}
          disabled={loading}
        >
          {loading ? (
            "Loading tokens..."
          ) : selectedToken ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedToken.symbol}</span>
              {selectedToken.balance !== undefined && (
                <span className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  ({formatBalance(selectedToken.balance, selectedToken.decimals)})
                </span>
              )}
            </div>
          ) : (
            "Select token..."
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={4} className={cn(
        "z-50 w-full p-0 border bg-white dark:bg-black pointer-events-auto",
        isDarkMode
          ? "bg-black/80 border-white/20"
          : "bg-white/80 border-black/20"
      )}>
        <Command className={cn(
          "bg-transparent",
          isDarkMode ? "text-white" : "text-black"
        )}>
          <CommandInput 
            placeholder="Search tokens..." 
            className={cn(
              "border-0 bg-transparent",
              isDarkMode ? "text-white placeholder:text-gray-400" : "text-black placeholder:text-gray-600"
            )}
          />
          <CommandEmpty className={cn(
            "py-6 text-center text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            No tokens found.
          </CommandEmpty>
          <CommandGroup className='w-full' value='tokens'>
            {tokens.map((token) => (
              <CommandItem
                key={token.address}
                value={`${token.symbol} ${token.name}`}
                onSelect={() => {
                    console.log('Selected token:', token)
                  onTokenSelect(token)
                  setOpen(false)
                }}
                className={cn(
                  "transition-colors"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-medium">{token.symbol}</span>
                    <span className={cn(
                      "text-xs",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {token.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {token.balance !== undefined && (
                      <span className={cn(
                        "text-sm",
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      )}>
                        {formatBalance(token.balance, token.decimals)}
                      </span>
                    )}
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedToken?.address === token.address ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}