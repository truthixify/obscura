// @refresh reset

import { WrongNetworkDropdown } from './WrongNetworkDropdown'
import { useAutoConnect } from '../../../hooks/scaffold-stark'
import { useTargetNetwork } from '../../../hooks/scaffold-stark/useTargetNetwork'
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core'
import { useEffect, useState } from 'react'
import ConnectModal from './ConnectModal'
import { Button } from '../../ui/button'
import { LogOut } from 'lucide-react'

interface CustomConnectButtonProps {
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

/**
 * Custom Connect Button (watch balance + custom design)
 */
export const CustomConnectButton = ({ controlStyles }: CustomConnectButtonProps) => {
    useAutoConnect()
    const { connector } = useConnect()
    const { disconnect } = useDisconnect()
    const { targetNetwork } = useTargetNetwork()
    const { account, status, address: accountAddress } = useAccount()
    const [accountChainId, setAccountChainId] = useState<bigint>(0n)

    // effect to get chain id and address from account
    useEffect(() => {
        if (account) {
            const getChainId = async () => {
                const chainId = await account.channel.getChainId()
                setAccountChainId(BigInt(chainId as string))
            }

            getChainId()
        }
    }, [account, status])

    useEffect(() => {
        const handleChainChange = (event: { chainId?: bigint }) => {
            const { chainId } = event
            if (chainId && chainId !== accountChainId) {
                setAccountChainId(chainId)
            }
        }
        connector?.on('change', handleChainChange)
        return () => {
            connector?.off('change', handleChainChange)
        }
    }, [connector])

    if (status === 'disconnected' || accountChainId === 0n)
        return <ConnectModal controlStyles={controlStyles} />

    if (accountChainId !== targetNetwork.id) {
        return <WrongNetworkDropdown />
    }

    return (
        <>
            <div className="flex gap-2">
                <Button
                    className={`py-1 px-3 md:py-2 md:px-4 flex items-center gap-2 ${controlStyles.buttonBg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.buttonHover} transition-all duration-200`}
                    // onClick={() => disconnect()}
                >
                    Set up account
                </Button>
                <Button
                    className={`py-1 px-3 md:py-2 md:px-4 flex items-center gap-2 ${controlStyles.buttonBg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.buttonHover} transition-all duration-200`}
                    onClick={() => disconnect()}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
            {/* <AddressInfoDropdown
                address={accountAddress as Address}
                displayName={''}
                ensAvatar={''}
                blockExplorerAddressLink={blockExplorerAddressLink}
            /> */}
        </>
    )
}
