// @ts-nocheck
import { Button } from './ui/button'
import { Moon, Sun, Wallet, Shield } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { useCallback, useRef, useState, useEffect } from 'react'
import { useOutsideClick } from '../hooks/scaffold-stark'
import { CustomConnectButton } from './scaffold-stark/CustomConnectButton'
import { useTheme } from 'next-themes'
import { useTargetNetwork } from '../hooks/scaffold-stark/useTargetNetwork'
import { devnet } from '@starknet-react/chains'
import { useAccount, useNetwork, useProvider } from '@starknet-react/core'

interface HeaderProps {
    currentPattern: number
    controlStyles: {
        bg: string
        border: string
        text: string
        buttonBg: string
        buttonText: string
        buttonHover: string
        secondaryBg: string
        secondaryText: string
        secondaryHover: string
    }
}

export function Header({ currentPattern, controlStyles }: HeaderProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const burgerMenuRef = useRef<HTMLDivElement>(null)

    useOutsideClick(
        burgerMenuRef,
        useCallback(() => setIsDrawerOpen(false), [])
    )

    const { targetNetwork } = useTargetNetwork()
    const isLocalNetwork = targetNetwork.network === devnet.network

    const { provider } = useProvider()
    const { address, status, chainId } = useAccount()
    const { chain } = useNetwork()
    const [isDeployed, setIsDeployed] = useState(true)

    useEffect(() => {
        if (
            status === 'connected' &&
            address &&
            chainId === targetNetwork.id &&
            chain.network === targetNetwork.network
        ) {
            provider
                .getClassHashAt(address)
                .then(classHash => {
                    if (classHash) setIsDeployed(true)
                    else setIsDeployed(false)
                })
                .catch(e => {
                    console.error('contract check', e)
                    if (e.toString().includes('Contract not found')) {
                        setIsDeployed(false)
                    }
                })
        }
    }, [status, address, provider, chainId, targetNetwork.id, targetNetwork.network, chain.network])

    return (
        <header
            className={`absolute top-0 left-0 right-0 w-full py-4 px-4 flex justify-between items-center z-50 ${controlStyles.bg} backdrop-blur-[1px] border-b rounded-bl-lg rounded-br-lg ${controlStyles.border}`}
        >
            <div className="flex items-center space-between">
                <h1 className={`text-4xl font-bold  ${controlStyles.text}`}>Obscura</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <CustomConnectButton controlStyles={controlStyles} />
                            </div>
                        </TooltipTrigger>
                        {status === 'connected' && !isDeployed ? (
                            <TooltipContent>
                                <span className="bg-[#8a45fc] text-[9px] p-1 text-white">
                                    Wallet Not Deployed
                                </span>
                            </TooltipContent>
                        ) : null}
                    </Tooltip>
                </TooltipProvider>
            </div>
        </header>
    )
}
