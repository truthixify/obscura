// @ts-nocheck
// @refresh reset

import { WrongNetworkDropdown } from './WrongNetworkDropdown'
import { useAutoConnect } from '../../../hooks/scaffold-stark'
import { useTargetNetwork } from '../../../hooks/scaffold-stark/useTargetNetwork'
import { useAccount, useConnect, useDisconnect, useProvider } from '@starknet-react/core'
import { useEffect, useState } from 'react'
import ConnectModal from './ConnectModal'
import { Button } from '../../ui/button'
import { LogOut, X, Copy, Check, Download } from 'lucide-react'
import { useBalanceStore } from '../../../stores/balance-store'
import { useAccountStore } from '../../../stores/account-store'
import { toast } from '../../ui/use-toast'
import { useKeypairStore } from '../../../stores/keypair-store'
import { downloadPrivateKeyFile } from '../../../lib/download-private-key-file'
import { useScaffoldContract } from '../../../hooks/scaffold-stark/useScaffoldContract'
import GenericModal from './GenericModal'
import { Card, CardContent, CardHeader } from '../../ui/card'
import { useTheme } from 'next-themes'
import { Checkbox } from '../../ui/checkbox'
import { createAccount } from '../../../lib/api'
import { useModalStore } from '../../../stores/modal-store'
import Utxo from '../../../utils/utxo'
import { parseNewCommitEvent } from '../../../utils/events_parsing'
import { RpcProvider } from 'starknet'
import { useUtxoStore } from '../../../stores/utxo-store'
import { ReloadIcon } from '@radix-ui/react-icons'

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
    const { account, status, address } = useAccount()
    const { balance, isLoadingBalance, reset: resetBalanceStore } = useBalanceStore()
    const [accountChainId, setAccountChainId] = useState<bigint>(0n)
    const {
        isRegistered,
        setIsRegistered,
        setOwner,
        setAddress,
        reset: resetAccountStore
    } = useAccountStore()
    const { keypair, reset: resetKeyStore } = useKeypairStore()
    const { data: obscura } = useScaffoldContract({
        contractName: 'Obscura'
    })
    const [showModal, setShowModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const [checkboxChecked, setCheckboxChecked] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const { theme } = useTheme()
    const { setIsModalOpen } = useModalStore()
    const { provider } = useProvider()
    const { setIsLoadingBalance, setBalance } = useBalanceStore()
    const { setUtxos } = useUtxoStore()

    const isDarkMode = theme == 'dark' ? true : false

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

    const closeModal = () => {
        setCheckboxChecked(false)
        setShowModal(false)
        setIsModalOpen(false)
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(keypair.privkey)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch (error) {
            console.error('Clipboard copy failed:', error)
            toast({
                title: 'Copy failed',
                description: 'Failed to copy private key. Try again.',
                variant: 'destructive'
            })
        }
    }

    const handleDownload = async () => {
        const filename = `obscura-key-file-${address.slice(0, 8)}`
        const content = keypair.privkey

        await downloadPrivateKeyFile(filename, content)
    }

    const handleRegister = async () => {
        setIsRegistering(true)

        try {
            const userAccount = {
                owner: address,
                public_key: keypair.address()
            }

            const tx = await obscura.register(userAccount)
            // const txReceipt = await provider.waitForTransaction(tx.transaction_hash)
            // const blockNumber = (txReceipt as any).block_number
            console.log(tx)

            const account = await createAccount({
                address: keypair.address(),
                owner: address
            })
            console.log('acc', account)

            setOwner(account.owner)
            setAddress(account.address)

            setIsRegistered(true)

            toast({
                title: 'Registration successful',
                description: "You've successfully registered",
                variant: 'success'
            })
        } catch (error) {
            setIsRegistering(false)
            console.log(error)
            toast({
                title: 'Registration failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'destructive'
            })
        } finally {
            setIsRegistering(false)
            setShowModal(false)
            setCheckboxChecked(false)
            closeModal()
        }
    }

    const handleSetup = async () => {
        if (!address) {
            toast({
                title: 'Wallet Not Connected',
                description: 'Please connect your wallet before setting up and account.',
                variant: 'destructive'
            })
            return
        }

        setShowModal(true)
        setIsModalOpen(true)
    }

    const handleLogout = () => {
        resetBalanceStore()
        resetAccountStore()
        resetKeyStore()
        disconnect()
    }

    const checkUserBalance = async () => {
        setIsLoadingBalance(true)

        const parsedNewCommitEvents = await parseNewCommitEvent(obscura, provider as RpcProvider, {
            block_number: 906832n
        })

        if (!parsedNewCommitEvents) return

        let balance: bigint = 0n

        const tryDecryptUtxo = (i: number): Utxo | undefined => {
            try {
                return Utxo.decrypt(
                    keypair,
                    parsedNewCommitEvents[i].encrypted_output,
                    parsedNewCommitEvents[i].index
                )
            } catch {
                try {
                    return Utxo.decrypt(
                        keypair,
                        parsedNewCommitEvents[i + 1].encrypted_output,
                        parsedNewCommitEvents[i + 1].index
                    )
                } catch {
                    return undefined
                }
            }
        }

        const utxos: Utxo[] = []
        for (let i = 0; i < parsedNewCommitEvents.length; i += 2) {
            const utxo = tryDecryptUtxo(i)
            if (!utxo) continue

            const nullifier = utxo.getNullifier()
            const isSpent = await obscura.is_spent(nullifier)

            if (!isSpent) {
                balance += BigInt(utxo.amount)
                utxos.push(utxo)
            }
        }

        setUtxos(utxos)
        setBalance(Number(balance) / 1e18)
        setIsLoadingBalance(false)
    }

    useEffect(() => {
        if (!keypair) return

        checkUserBalance()
    }, [keypair])

    if ((status === 'disconnected' || accountChainId === 0n) && !keypair)
        return <ConnectModal controlStyles={controlStyles} />

    if (accountChainId !== targetNetwork.id && !keypair) {
        return <WrongNetworkDropdown />
    }

    return (
        <>
            <div className="flex gap-2">
                {!isRegistered ? (
                    <Button
                        className={`py-1 px-3 md:py-2 md:px-4 flex items-center gap-2 ${controlStyles.buttonBg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.buttonHover} transition-all duration-200`}
                        onClick={handleSetup}
                        // disabled={!owner}
                    >
                        {isRegistering ? 'Setting up account...' : 'Set up account'}
                    </Button>
                ) : (
                    <Button
                        className={`py-1 px-3 md:py-2 md:px-4 flex items-center gap-2 ${controlStyles.buttonBg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.buttonHover} transition-all duration-200`}
                    >
                        <span>Balance: {balance.toFixed(2)} $STRK</span>
                    </Button>
                )}
                {isRegistered && (
                    <Button
                        className={`py-1 px-3 md:py-2 md:px-4 flex items-center gap-2 ${controlStyles.buttonBg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.buttonHover} transition-all duration-200`}
                        onClick={checkUserBalance}
                    >
                        {isLoadingBalance ? (
                            <ReloadIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <ReloadIcon className="h-4 w-4" />
                        )}
                    </Button>
                )}
                <Button
                    className={`py-1 px-3 md:py-2 md:px-4 flex items-center gap-2 ${controlStyles.buttonBg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.buttonHover} transition-all duration-200`}
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
            {showModal && (
                <GenericModal onClose={closeModal}>
                    <Card
                        className={`w-full max-w-2xl border border-black/20 shadow-2xl transition-all duration-300 ${
                            isDarkMode
                                ? 'bg-black/30 border-white/20 shadow-black/50'
                                : 'bg-white/30 border-black/20 shadow-black/20'
                        }`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3
                                className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}
                            >
                                Shielded Key
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    closeModal()
                                }}
                                className={`p-2 flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-black'}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <span>
                                Please back up your shielded key to access your account in the
                                future. DO NOT share your key with anyone
                            </span>

                            <div className="w-full flex justify-between items-center gap-2">
                                <Button
                                    className={`w-full mt-4 p-2 flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                                    onClick={handleDownload}
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </Button>
                                <Button
                                    className={`w-full mt-4 p-2 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                            <div className="mt-4 flex items-center space-x-2">
                                <Checkbox
                                    id="backup-confirm"
                                    checked={checkboxChecked}
                                    onCheckedChange={checked => setCheckboxChecked(!!checked)}
                                />
                                <label
                                    htmlFor="backup-confirm"
                                    className={`text-xs leading-5 ${isDarkMode ? 'text-white' : 'text-black'}`}
                                >
                                    I have backed up my shielded key.
                                </label>
                            </div>

                            <Button
                                className={`w-full mt-4 p-2 flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                                disabled={!checkboxChecked}
                                onClick={handleRegister}
                            >
                                {isRegistering ? 'Registering...' : 'Register'}
                            </Button>
                        </CardContent>
                    </Card>
                </GenericModal>
            )}
        </>
    )
}
