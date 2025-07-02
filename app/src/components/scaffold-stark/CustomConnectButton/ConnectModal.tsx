import { Connector, useConnect } from '@starknet-react/core'
import { useState } from 'react'
import Wallet from '../../scaffold-stark/CustomConnectButton/Wallet'
import { useLocalStorage } from 'usehooks-ts'
import { BurnerConnector, burnerAccounts } from '@scaffold-stark/stark-burner'
import { BlockieAvatar } from '../BlockieAvatar'
import GenericModal from './GenericModal'
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from '../../../utils/Constants'
import { Button } from '../../ui/button'
import { X, KeySquare } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Card, CardHeader, CardContent, CardFooter } from '../../ui/card'
import { Input } from '../../ui/input'
import { Keypair } from '../../../utils/keypair'
import { useKeypairStore } from '../../../stores/keypair-store'
import { toast } from '../../ui/use-toast'
import { getAccount } from '../../../lib/api'
import { useAccountStore } from '../../../stores/account-store'
import { useWalletModalStore } from '../../../stores/wallet-modal-store'

const loader = ({ src }: { src: string }) => {
    return src
}

interface CustomModalProps {
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

const ConnectModal = ({ controlStyles }: CustomModalProps) => {
    const { setKeypair } = useKeypairStore()
    const [showModal, setShowModal] = useState(false)
    const [isBurnerWallet, setIsBurnerWallet] = useState(false)
    const [privateKey, setPrivateKey] = useState('')
    const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false)
    const { resolvedTheme } = useTheme()
    const isDarkMode = resolvedTheme === 'dark'
    const { connectors, connect, status } = useConnect()
    const [_, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
        'lastUsedConnector',
        { id: '' },
        {
            initializeWithValue: false
        }
    )
    const [, setLastConnectionTime] = useLocalStorage<number>(
        LAST_CONNECTED_TIME_LOCALSTORAGE_KEY,
        0
    )
    const { setIsRegistered, setAddress, setOwner } = useAccountStore()
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    const {setIsWalletModalOpen} = useWalletModalStore()

    const openModal = () => {
        setIsWalletModalOpen(true)
        setShowModal(true)
    }
    const closeModal = () => {
        setShowModal(false)
        setIsWalletModalOpen(false)
    }

    // Replace `handleCloseModal` usage:
    const handleCloseModal = closeModal

    function handleConnectWallet(
        _: React.MouseEvent<HTMLButtonElement>,
        connector: Connector
    ): void {
        if (connector.id === 'burner-wallet') {
            setIsBurnerWallet(true)
            return
        }
        connect({ connector })
        setLastConnector({ id: connector.id })
        setLastConnectionTime(Date.now())
        handleCloseModal()
    }

    function handleConnectBurner(_: React.MouseEvent<HTMLButtonElement>, ix: number) {
        const connector = connectors.find(it => it.id == 'burner-wallet')
        if (connector && connector instanceof BurnerConnector) {
            connector.burnerAccount = burnerAccounts[ix]
            connect({ connector })
            setLastConnector({ id: connector.id, ix })
            setLastConnectionTime(Date.now())
            handleCloseModal()
        }
    }

    const handleLoginWithPrivateKey = async () => {
        setIsLoggingIn(true)
        try {
            try {
                const keypair = new Keypair(privateKey)
                const keypairAddress = keypair.address()
                const account = await getAccount({ address: keypairAddress })

                setKeypair(keypair)
                setOwner(account.owner)
                setAddress(account.address)
                setIsRegistered(true)
                setShowPrivateKeyModal(false)

                closeModal()
            } catch (error) {
                throw error
            }
        } catch (error) {
            toast({
                title: 'Failed to login with private key',
                description:
                    error instanceof Error ? error.message : error.error ? error.error : error,
                variant: 'destructive'
            })
        } finally {
            setIsLoggingIn(false)
        }
    }

    return (
        <div>
            <Button
                variant="outline"
                onClick={openModal}
                className={`py-1 px-3 md:py-2 md:px-4 flex items-center gap-2 ${controlStyles.buttonBg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.buttonHover} transition-all duration-200`}
                disabled={status === 'pending'}
            >
                {status === 'pending' ? (
                    <>
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                        Logging in...
                    </>
                ) : status === 'success' ? (
                    'Connected'
                ) : (
                    <>Login</>
                )}
            </Button>

            {(!showPrivateKeyModal && showModal) && (
                <GenericModal onClose={closeModal}>
                    <Card
                        className={`w-full max-w-2xl border shadow-2xl transition-all duration-300 ${
                            isDarkMode
                                ? 'bg-black/30 border-white/20 shadow-black/50'
                                : 'bg-white/30 border-black/20 shadow-black/20'
                        }`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3
                                className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}
                            >
                                Login
                            </h3>
                            <button
                                onClick={() => {
                                    setIsBurnerWallet(false)
                                    closeModal()
                                }}
                                className={`p-2 flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-black'}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </CardHeader>
                        <CardContent className='flex flex-wrap gap-2'>
                            <button
                                className={`md:w-1/2 w-full py-3 px-4 flex items-center gap-3 ${controlStyles.bg} ${controlStyles.text} border ${controlStyles.border} ${controlStyles.secondaryHover} rounded-lg`}
                                onClick={() => setShowPrivateKeyModal(true)}
                            >
                                <KeySquare className="h-6 w-6" />
                                <span className="">Private Key</span>
                            </button>
                            {!isBurnerWallet ? (
                                // Wallet options
                                connectors.map((connector, index) => (
                                    <div className={`md:w-1/2 w-full ${controlStyles.bg} ${controlStyles.text} border ${controlStyles.border} ${controlStyles.secondaryHover} rounded-lg`} key={connector.id || index}>
                                        <Wallet
                                            connector={connector}
                                            loader={loader}
                                            handleConnectWallet={handleConnectWallet}
                                        />
                                    </div>
                                ))
                            ) : (
                                // Burner wallet accounts
                                <div className="flex flex-col gap-3">
                                    <div className="max-h-[300px] overflow-y-auto flex w-full flex-col gap-2">
                                        {burnerAccounts.map((burnerAcc, ix) => (
                                            <button
                                                key={burnerAcc.publicKey}
                                                className="retro-button retro-button-outline w-full py-3 px-4 flex items-center gap-3"
                                                onClick={e => handleConnectBurner(e, ix)}
                                            >
                                                <BlockieAvatar
                                                    address={burnerAcc.accountAddress}
                                                    size={35}
                                                />
                                                <span className="font-bold">
                                                    {`${burnerAcc.accountAddress.slice(0, 6)}...${burnerAcc.accountAddress.slice(-4)}`}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            {isBurnerWallet && (
                                <div className="mt-4 flex justify-start">
                                    <button
                                        onClick={() => setIsBurnerWallet(false)}
                                        className={`py-2 px-3 md:py-2 md:px-4 flex items-center rounded-md ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                                    >
                                        Back to Wallets
                                    </button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </GenericModal>
            )}
            {showPrivateKeyModal && (
                <GenericModal onClose={closeModal}>
                    <Card
                        className={`w-full max-w-2xl border shadow-2xl transition-all duration-300 ${
                            isDarkMode
                                ? 'bg-black/30 border-white/20 shadow-black/50'
                                : 'bg-white/30 border-black/20 shadow-black/20'
                        }`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3
                                className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}
                            >
                                Private Key
                            </h3>
                            <button
                                onClick={() => {
                                    setPrivateKey('')
                                    setShowPrivateKeyModal(false)
                                }}
                                className={`p-2 flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-black'}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <Input
                                id="fund-address"
                                placeholder="Enter your shielded pool private key..."
                                value={privateKey}
                                onChange={e => setPrivateKey(e.target.value)}
                                className={`backdrop-blur-sm border transition-colors duration-200 h-14 ${
                                    isDarkMode
                                        ? 'bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:border-white/40'
                                        : 'bg-white/20 border-black/20 text-black placeholder:text-gray-600 focus:ring-black/30 focus:border-black/40'
                                }`}
                            />
                            <Button
                                className={`w-full mt-4 p-2 flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                                onClick={handleLoginWithPrivateKey}
                            >
                                {isLoggingIn ? 'Logging in...' : 'Login'}
                            </Button>
                        </CardContent>
                    </Card>
                </GenericModal>
            )}
        </div>
    )
}

export default ConnectModal
