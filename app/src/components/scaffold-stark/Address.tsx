// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import { Address as AddressType } from '@starknet-react/chains'
import { getChecksumAddress, StarkProfile } from 'starknet'
import { useTargetNetwork } from '../../hooks/scaffold-stark/useTargetNetwork'
import { getBlockExplorerAddressLink } from '../../utils/scaffold-stark'

type AddressProps = {
    address?: AddressType
    disableAddressLink?: boolean
    format?: 'short' | 'long'
    profile?: StarkProfile
    isLoading?: boolean
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

const blockieSizeMap = {
    xs: 6,
    sm: 7,
    base: 8,
    lg: 9,
    xl: 10,
    '2xl': 12,
    '3xl': 15
}

/**
 * Displays an address (or ENS) with a Blockie image and option to copy address.
 */
export const Address = ({
    address,
    disableAddressLink,
    format,
    profile,
    isLoading,
    size = 'base'
}: AddressProps) => {
    const [ensAvatar, setEnsAvatar] = useState<string | null>()
    const [addressCopied, setAddressCopied] = useState(false)

    const { targetNetwork } = useTargetNetwork()

    const checkSumAddress = useMemo(() => {
        if (!address) return undefined

        if (address.toLowerCase() === '0x') {
            return '0x0'
        }

        return getChecksumAddress(address)
    }, [address])

    const blockExplorerAddressLink = getBlockExplorerAddressLink(
        targetNetwork,
        checkSumAddress || address || ''
    )

    const isValidHexAddress = (value: string): boolean => {
        if (value.toLowerCase() === '0x') {
            value = '0x0'
        }

        if (value.toLowerCase() === '0x0x0') {
            return false
        }

        const hexAddressRegex = /^0x[0-9a-fA-F]+$/
        return hexAddressRegex.test(value)
    }

    const [displayAddress, setDisplayAddress] = useState(
        checkSumAddress?.slice(0, 6) + '...' + checkSumAddress?.slice(-4)
    )

    useEffect(() => {
        const addressWithFallback = checkSumAddress || address || ''

        if (profile?.name) {
            setDisplayAddress(profile.name)
        } else if (format === 'long') {
            setDisplayAddress(addressWithFallback || '')
        } else {
            setDisplayAddress(
                addressWithFallback.slice(0, 6) + '...' + addressWithFallback.slice(-4)
            )
        }
    }, [profile, checkSumAddress, address, format])

    // Skeleton UI
    if (isLoading) {
        return (
            <div className="animate-pulse flex space-x-4">
                <div className="rounded-md bg-slate-300 h-6 w-6"></div>
                <div className="flex items-center space-y-6">
                    <div className="h-2 w-28 bg-slate-300 rounded"></div>
                </div>
            </div>
        )
    }

    // if (!checkSumAddress) {
    //   return (
    //     <div className="italic text-base font-bold ">Wallet not connected</div>
    //   );
    // }

    // if (!checkSumAddress) {
    //   return <span className="text-error">Invalid address format</span>;
    // }

    return <div className="flex items-center"></div>
}
