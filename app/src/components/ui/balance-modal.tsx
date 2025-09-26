import { useState } from 'react'
import { Button } from './button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Card, CardContent } from './card'
import { Wallet, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import { useShieldedBalances } from '../../hooks/useShieldedBalances'

interface BalanceModalProps {
  trigger?: React.ReactNode
  className?: string
}

export function BalanceModal({ trigger, className }: BalanceModalProps) {
  const [open, setOpen] = useState(false)
  const { isDarkMode } = useTheme()
  const { balances, loading, error, refreshBalances } = useShieldedBalances()

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

  const getTotalBalanceText = () => {
    if (loading) return 'Loading...'
    if (error) return 'Error'
    if (balances.length === 0) return 'No balances'
    
    const nonZeroBalances = balances.filter(b => b.balance > 0n)
    if (nonZeroBalances.length === 0) return '0 Balance'
    if (nonZeroBalances.length === 1) {
      const balance = nonZeroBalances[0]
      return `${formatBalance(balance.balance, balance.token.decimals)} ${balance.token.symbol}`
    }
    
    return `${nonZeroBalances.length} Tokens`
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      className={cn(
        "backdrop-blur-sm border transition-colors duration-200",
        isDarkMode
          ? "bg-black/20 border-white/20 text-white hover:bg-black/30"
          : "bg-white/20 border-black/20 text-black hover:bg-white/30",
        className
      )}
    >
      <Wallet className="w-4 h-4 mr-2" />
      {getTotalBalanceText()}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn(
        "max-w-md backdrop-blur-xl border",
        isDarkMode
          ? "bg-black/80 border-white/20"
          : "bg-white/80 border-black/20"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center justify-between",
            isDarkMode ? "text-white" : "text-black"
          )}>
            <span>Shielded Pool Balances</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshBalances}
              disabled={loading}
              className={cn(
                "h-8 w-8 p-0 mr-4",
                isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10"
              )}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                loading && "animate-spin"
              )} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className={cn(
              "text-center py-8",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Loading balances...
            </div>
          )}

          {error && (
            <div className={cn(
              "text-center py-8 text-red-500"
            )}>
              {error}
            </div>
          )}

          {!loading && !error && balances.length === 0 && (
            <div className={cn(
              "text-center py-8",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              No tokens found
            </div>
          )}

          {!loading && !error && balances.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {balances.map((balance) => (
                <Card
                  key={balance.token.address}
                  className={cn(
                    "backdrop-blur-sm border transition-colors duration-200",
                    isDarkMode
                      ? "bg-black/10 border-white/10"
                      : "bg-white/10 border-black/10"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-medium",
                          isDarkMode ? "text-white" : "text-black"
                        )}>
                          {balance.token.symbol}
                        </span>
                        <span className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {balance.token.name}
                        </span>
                        {balance.utxos.length > 0 && (
                          <span className={cn(
                            "text-xs mt-1",
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          )}>
                            {balance.utxos.length} UTXO{balance.utxos.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "font-mono text-lg",
                          isDarkMode ? "text-gray-300" : "text-gray-700",
                          balance.balance === 0n && "text-gray-500"
                        )}>
                          {formatBalance(balance.balance, balance.token.decimals)}
                        </div>
                        {balance.balance === 0n && (
                          <div className={cn(
                            "text-xs",
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          )}>
                            No balance
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className={cn(
            "text-xs text-center pt-2 border-t",
            isDarkMode 
              ? "text-gray-500 border-white/10" 
              : "text-gray-500 border-black/10"
          )}>
            Balances are calculated from your private UTXOs
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}