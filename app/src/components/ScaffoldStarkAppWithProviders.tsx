import React, { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { StarknetConfig, starkscan } from '@starknet-react/core'
import { ProgressBar } from './scaffold-stark/ProgressBar'
import { appChains, connectors } from '../services/web3/connectors'
import provider from '../services/web3/provider'

const ScaffoldStarkApp = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <div className="flex relative flex-col min-h-screen bg-main">
                {/* <Header /> */}
                <main className="relative flex flex-col flex-1">{children}</main>
            </div>
            <Toaster />
        </>
    )
}

export const ScaffoldStarkAppWithProviders = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <StarknetConfig
            chains={appChains}
            provider={provider}
            connectors={connectors}
            explorer={starkscan}
        >
            <ProgressBar />
            <ScaffoldStarkApp>{children}</ScaffoldStarkApp>
        </StarknetConfig>
    )
}
