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
import { Card, CardHeader, CardContent } from '../../ui/card'
import { Input } from '../../ui/input'

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
    const [showModal, setShowModal] = useState(false)
    // const modalRef = useRef<HTMLInputElement>(null)
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

    // const handleCloseModal = () => {
    //   if (modalRef.current) {
    //     modalRef.current.checked = false;
    //   }
    // };
    const openModal = () => setShowModal(true)
    const closeModal = () => setShowModal(false)

    // Replace `handleCloseModal` usage:
    const handleCloseModal = closeModal

    function handleConnectWallet(
        e: React.MouseEvent<HTMLButtonElement>,
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

    function handleConnectBurner(e: React.MouseEvent<HTMLButtonElement>, ix: number) {
        const connector = connectors.find(it => it.id == 'burner-wallet')
        if (connector && connector instanceof BurnerConnector) {
            connector.burnerAccount = burnerAccounts[ix]
            connect({ connector })
            setLastConnector({ id: connector.id, ix })
            setLastConnectionTime(Date.now())
            handleCloseModal()
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
                        Connecting...
                    </>
                ) : status === 'success' ? (
                    'Connected'
                ) : (
                    <>Login</>
                )}
            </Button>

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
                        <CardContent>
                            <button
                                className="retro-button retro-button-outline w-full py-3 px-4 flex items-center gap-3"
                                onClick={() => setShowPrivateKeyModal(true)}
                            >
                                <KeySquare className="h-6 w-6" />
                                <span className="">Private Key</span>
                            </button>
                            {!isBurnerWallet ? (
                                // Wallet options
                                connectors.map((connector, index) => (
                                    <Wallet
                                        key={connector.id || index}
                                        connector={connector}
                                        loader={loader}
                                        handleConnectWallet={handleConnectWallet}
                                    />
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
                    </Card>

                    {isBurnerWallet && (
                        <div className="mt-4 flex justify-start">
                            <button
                                onClick={() => setIsBurnerWallet(false)}
                                className="retro-button retro-button-secondary py-2 px-4 flex items-center gap-2"
                            >
                                Back to Wallets
                            </button>
                        </div>
                    )}
                </GenericModal>
            )}
            {showPrivateKeyModal && (
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
                                Input Private Key
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPrivateKeyModal(false)
                                    closeModal()
                                }}
                                className={`p-2 flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-black'}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <Input
                                id="fund-address"
                                placeholder="Enter your private key..."
                                value={privateKey}
                                onChange={e => setPrivateKey(e.target.value)}
                                className={`backdrop-blur-sm border transition-colors duration-200 h-14 ${
                                    isDarkMode
                                        ? 'bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:border-white/40'
                                        : 'bg-white/20 border-black/20 text-black placeholder:text-gray-600 focus:ring-black/30 focus:border-black/40'
                                }`}
                            />
                        </CardContent>
                    </Card>
                </GenericModal>
            )}
        </div>
    )
}

export default ConnectModal
