// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react'
import { Connector } from '@starknet-react/core'
// import Image from "next/image";
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

const Wallet = ({
    handleConnectWallet,
    connector,
    loader
}: {
    connector: Connector
    loader: ({ src }: { src: string }) => string
    handleConnectWallet: (connector: Connector) => void
}) => {
    const [clicked, setClicked] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const { resolvedTheme } = useTheme()
    const isDarkMode = resolvedTheme === 'dark'

    // connector has two : dark and light icon
    const icon = useMemo(() => {
        return typeof connector.icon === 'object'
            ? resolvedTheme === 'dark'
                ? (connector.icon.dark as string)
                : (connector.icon.light as string)
            : (connector.icon as string)
    }, [connector, resolvedTheme])
    useEffect(() => {
        setIsMounted(true)
    }, [])

    return isMounted ? (
        <button
            className="retro-button retro-button-outline w-full py-3 px-4 flex items-center gap-3 justify-start"
            onClick={e => {
                setClicked(true)
                handleConnectWallet(e, connector)
            }}
        >
            <div className="h-[1.5rem] w-[1.5rem] rounded-[5px]">
                <img
                    alt={connector.name}
                    // loader={loader}
                    src={icon}
                    width={70}
                    height={70}
                    className="h-full w-full object-cover rounded-[5px]"
                />
            </div>
            <span className=" text-start m-0">{connector.name}</span>
        </button>
    ) : null
}

export default Wallet
