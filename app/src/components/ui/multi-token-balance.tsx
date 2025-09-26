import { useShieldedBalances } from '../../hooks/useShieldedBalances'
import { Card, CardContent } from './card'
import { Label } from './label'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'

interface MultiTokenBalanceProps {
  className?: string
}

export function MultiTokenBalance({ className }: MultiTokenBalanceProps) {
  const { isDarkMode } = useTheme()
  const { balances, loading, error } = useShieldedBalances()

  const formatBalance = (balance: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals)
    const whole = balance / divisor
    const fraction = balance % divisor
    
    if (fraction === 0n) {
      return whole.toString()
    }
    
    const fractionStr = fraction.toString().padStart(decimals, '0')
    const trimmedFraction = fractionStr.replace(/0+$/, '')
    
    return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString()
  }

  if (loading) {
    return (
      <Card className={cn(
        "backdrop-blur-sm border transition-colors duration-200",
        isDarkMode
          ? "bg-black/10 border-white/10"
          : "bg-white/10 border-black/10",
        className
      )}>
        <CardContent className="p-4">
          <div className={cn(
            "text-center",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            Loading token balances...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn(
        "backdrop-blur-sm border transition-colors duration-200",
        isDarkMode
          ? "bg-black/10 border-white/10"
          : "bg-white/10 border-black/10",
        className
      )}>
        <CardContent className="p-4">
          <div className={cn(
            "text-center text-red-500"
          )}>
            Error loading balances
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "backdrop-blur-sm border transition-colors duration-200",
      isDarkMode
        ? "bg-black/10 border-white/10"
        : "bg-white/10 border-black/10",
      className
    )}>
      <CardContent className="p-4 space-y-3">
        <Label className={cn(
          "font-medium text-sm",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Shielded Pool Balances
        </Label>
        
        {balances.length === 0 ? (
          <div className={cn(
            "text-center text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            No shielded balances
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map((balance) => (
              <div
                key={balance.token.address}
                className={cn(
                  "flex justify-between items-center p-2 rounded-md backdrop-blur-sm border transition-colors duration-200",
                  isDarkMode
                    ? "bg-black/5 border-white/5"
                    : "bg-white/5 border-black/5"
                )}
              >
                <div className="flex flex-col">
                  <span className={cn(
                    "font-medium text-sm",
                    isDarkMode ? "text-white" : "text-black"
                  )}>
                    {balance.token.symbol}
                  </span>
                  <span className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    {balance.token.name}
                  </span>
                  {balance.utxos.length > 0 && (
                    <span className={cn(
                      "text-xs",
                      isDarkMode ? "text-gray-500" : "text-gray-500"
                    )}>
                      {balance.utxos.length} UTXO{balance.utxos.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className={cn(
                  "text-sm font-mono",
                  isDarkMode ? "text-gray-300" : "text-gray-700",
                  balance.balance === 0n && "text-gray-500"
                )}>
                  {formatBalance(balance.balance, balance.token.decimals)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}