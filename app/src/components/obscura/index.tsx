// @ts-nocheck

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Label } from '../ui/label'
import {
    Send,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Palette,
    Play,
    Pause,
    ChevronDown,
    ChevronUp,
    Sun,
    Moon,
    Settings,
    BotOff,
    Bot
} from 'lucide-react'
import { useToast } from '../../hooks/use-toast'
import { Header } from '../header'
import { useTheme } from 'next-themes'
import { transaction } from '../../utils/index'
import Utxo from '../../utils/utxo'
import { useScaffoldContract } from '../../hooks/scaffold-stark/useScaffoldContract'
import { useAccount, useProvider } from '@starknet-react/core'
import { Account } from 'starknet'
import { useBalanceStore } from '../../stores/balance-store'
import { useKeypairStore } from '../../stores/keypair-store'
import { generateKeypairFromSignature } from '../../utils/utils'
import { AccountData, getAccount } from '../../lib/api'
import { useAccountStore } from '../../stores/account-store'
import { Keypair } from '../../utils/keypair'
import SettingsModal from './settings'
import { useModalStore } from '../../stores/modal-store'
import { useUtxoStore } from '../../stores/utxo-store'
import { TrackNextIcon } from '@radix-ui/react-icons'
// import { avnuPaymasterProvider } from '@starknet-react/core'

const Index = () => {
    const { data: obscura } = useScaffoldContract({
        contractName: 'Obscura'
    })
    const { data: strk } = useScaffoldContract({
        contractName: 'Strk'
    })
    const { provider } = useProvider()
    const { address, account } = useAccount()

    const { toast } = useToast()
    const { theme, setTheme } = useTheme()
    const [isAnimated, setIsAnimated] = useState(true)
    const [currentPattern, setCurrentPattern] = useState(0)
    const [isArtControlOpen, setIsArtControlOpen] = useState(false)
    const [isArt, setIsArt] = useState(true)

    // Utxo state
    const { utxos } = useUtxoStore()

    // Wallet modal state
    const { isModalOpen, setIsModalOpen } = useModalStore()

    // Settings modal state
    const [isSettinngsOpen, setIsSettingsOpen] = useState(false)
    const closeSettingsModal = () => {
        setIsSettingsOpen(false)
        setIsModalOpen(false)
    }

    // Balance state
    const { balance } = useBalanceStore()

    // Keypair state
    const { keypair, setKeypair } = useKeypairStore()

    // Register state
    const { isRegistered, setIsRegistered } = useAccountStore()

    // Fund tab state
    const [fundAmount, setFundAmount] = useState(0)
    const [fundAddress, setFundAddress] = useState('')
    const [isFunding, setIsFunding] = useState(false)
    const [isApproved, setIsApproved] = useState(false)
    const [isApproving, setIsApproving] = useState(false)

    // Transfer tab state
    const [transferAmount, setTransferAmount] = useState(0)
    const [transferAddress, setTransferAddress] = useState('')
    const [isTransfering, setIsTransfering] = useState(false)

    // Withdraw tab state
    const [withdrawAmount, setWithdrawAmount] = useState(0)
    const [withdrawAddress, setWithdrawAddress] = useState('')
    const [clickedAmount, setClickedAmount] = useState<number | null>(null)
    const [isWithdrawing, setIsWithdrawing] = useState(false)

    const predefinedAmounts = [10, 100, 1000, 10000]

    const patterns = [
        'Flowing Gradients',
        'Sharp Boundaries',
        'Organic Forms',
        'Geometric Patterns',
        'Ripple Effects'
    ]

    const isDarkMode = theme == 'dark'

    // Define control styles based on current pattern
    const getControlStyles = () => {
        switch (currentPattern) {
            case 0: // Flowing Gradients - mixed background
                return {
                    bg: 'bg-white/90',
                    border: 'border-black/30',
                    text: 'text-black',
                    buttonBg: 'bg-black',
                    buttonText: 'text-white',
                    buttonHover: 'hover:bg-gray-800',
                    secondaryBg: 'bg-gray-100',
                    secondaryText: 'text-black',
                    secondaryHover: 'hover:bg-gray-200'
                }
            case 1: // Sharp Boundaries - high contrast
                return {
                    bg: 'bg-white/95',
                    border: 'border-black/40',
                    text: 'text-black',
                    buttonBg: 'bg-black',
                    buttonText: 'text-white',
                    buttonHover: 'hover:bg-gray-800',
                    secondaryBg: 'bg-white',
                    secondaryText: 'text-black',
                    secondaryHover: 'hover:bg-gray-50'
                }
            case 2: // Organic Forms - mostly white with black shapes
                return {
                    bg: 'bg-black/90',
                    border: 'border-white/30',
                    text: 'text-white',
                    buttonBg: 'bg-white',
                    buttonText: 'text-black',
                    buttonHover: 'hover:bg-gray-200',
                    secondaryBg: 'bg-black',
                    secondaryText: 'text-white',
                    secondaryHover: 'hover:bg-gray-800'
                }
            case 3: // Geometric Patterns - checkerboard
                return {
                    bg: 'bg-gray-500/90',
                    border: 'border-white/40',
                    text: 'text-white',
                    buttonBg: 'bg-white',
                    buttonText: 'text-black',
                    buttonHover: 'hover:bg-gray-200',
                    secondaryBg: 'bg-black/80',
                    secondaryText: 'text-white',
                    secondaryHover: 'hover:bg-black/60'
                }
            case 4: // Ripple Effects - radial gradient
                return {
                    bg: 'bg-black/85',
                    border: 'border-white/35',
                    text: 'text-white',
                    buttonBg: 'bg-white',
                    buttonText: 'text-black',
                    buttonHover: 'hover:bg-gray-200',
                    secondaryBg: 'bg-gray-800/80',
                    secondaryText: 'text-white',
                    secondaryHover: 'hover:bg-gray-700/80'
                }
            default:
                return {
                    bg: 'bg-black/10',
                    border: 'border-black/20',
                    text: 'text-black',
                    buttonBg: 'bg-black',
                    buttonText: 'text-white',
                    buttonHover: 'hover:bg-gray-800',
                    secondaryBg: 'bg-white',
                    secondaryText: 'text-black',
                    secondaryHover: 'hover:bg-gray-50'
                }
        }
    }

    const controlStyles = getControlStyles()

    useEffect(() => {
        if (isAnimated && isArt) {
            const interval = setInterval(() => {
                setCurrentPattern(prev => (prev + 1) % patterns.length)
            }, 4000)
            return () => clearInterval(interval)
        }
    }, [isAnimated, isArt, patterns.length])

    useEffect(() => {
        if (!address || !account) return

        const loadKeypair = async () => {
            const keypair = await generateKeypairFromSignature(account as Account)
            setKeypair(keypair)

            try {
                const account = await getAccount({ address: keypair.address() })

                if (account) setIsRegistered(true)
            } catch (error) {
                setIsRegistered(false)
                console.log(error)
            }
        }

        loadKeypair()
    }, [address, account])

    useEffect(() => {
        if (!address || !keypair) return

        const fetchUserAddress = async () => {
            let account: AccountData
            try {
                account = await getAccount({ address: keypair.address() })

                if (account) setIsRegistered(true)
            } catch (error) {
                setIsRegistered(false)
                console.log(error)
            }

            setFundAddress(address || account.owner)
        }

        fetchUserAddress()
    }, [address, keypair])

    const handleFund = async () => {
        if (!fundAmount || !fundAddress) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all fields before funding.',
                variant: 'destructive'
            })
            return
        }

        setIsFunding(true)

        try {
            toast({
                title: 'Fund Initiated',
                description: `Funding ${fundAmount} STRK to ${fundAddress.slice(0, 10)}...${fundAddress.slice(-5)}`
            })

            const newUtxo = new Utxo({ amount: BigInt(fundAmount * 1e18), keypair })
            const tx = await transaction({
                obscura,
                provider,
                outputs: [newUtxo],
                account: {
                    owner: address,
                    public_key: newUtxo.keypair.address()
                }
            })

            if (tx) {
                toast({
                    title: 'Fund successful',
                    description: (
                        <div>
                            <p>
                                {fundAmount} STRK deposited to {fundAddress.slice(0, 10)}…{fundAddress.slice(-5)}
                            </p>
                            <a
                                href={`https://sepolia.starkscan.co/tx/${tx.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-200 hover:text-white"
                            >
                                Transaction details
                            </a>
                        </div>
                    ),
                    variant: 'success'
                })
            }
        } catch (error) {
            console.log(error)
            setIsFunding(false)
            toast({
                title: 'Fund failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'destructive'
            })
        } finally {
            setIsFunding(false)
            setIsApproved(false)
        }
    }

    const handleApproveStrk = async () => {
        if (!fundAmount || !fundAddress) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all fields before funding.',
                variant: 'destructive'
            })
            return
        }

        setIsApproving(true)

        try {
            const tx = await strk.approve(obscura.address, BigInt(fundAmount * 1e18))
        } catch (error) {
            setIsApproved(false)
            setIsApproving(false)
            toast({
                title: 'Approval Failed',
                description: error instanceof Error ? error.message : error,
                variant: 'destructive'
            })
        } finally {
            setIsApproved(true)
            setIsApproving(false)
        }
    }

    const handleTransfer = async () => {
        if (!transferAmount || !transferAddress) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all fields before transferring.',
                variant: 'destructive'
            })
            return
        }
        setIsTransfering(true)

        try {
            toast({
                title: 'Transfer Initiated',
                description: `Transferring ${transferAmount} STRK to ${transferAddress.slice(0, 10)}...${transferAddress.slice(-5)}`
            })

            const requiredAmount = BigInt(transferAmount * 1e18)
            const availableUtxos = utxos || []

            // Sort smallest UTXOs first
            const sortedUtxos = availableUtxos.sort((a, b) =>
                Number(BigInt(a.amount) / BigInt(1e18) - BigInt(b.amount) / BigInt(1e18))
            )

            const selectedUtxos: Utxo[] = []
            let totalSelected = 0n

            for (const utxo of sortedUtxos) {
                selectedUtxos.push(utxo)
                totalSelected += BigInt(utxo.amount)
                if (totalSelected >= requiredAmount) break
            }

            if (totalSelected < requiredAmount) {
                toast({
                    title: 'Insufficient Funds',
                    description: 'Your available UTXOs cannot cover the transfer amount.',
                    variant: 'destructive'
                })
                return
            }

            const receiverKeypair = Keypair.fromString(transferAddress)
            const receiverNewUtxo = new Utxo({
                amount: requiredAmount,
                keypair: receiverKeypair
            })

            const outputs = [receiverNewUtxo]

            const change = totalSelected - requiredAmount
            if (change > 0n) {
                const senderChangeUtxo = new Utxo({
                    amount: change,
                    keypair
                })
                outputs.push(senderChangeUtxo)
            }

            const account = await getAccount({ address: receiverKeypair.address() })

            if (!account.owner) {
                toast({
                    title: 'Invalid address',
                    description: 'Could not find account for recipient.',
                    variant: 'destructive'
                })
                return
            }

            const tx = await transaction({
                obscura,
                provider,
                inputs: selectedUtxos,
                outputs
            })

            toast({
                title: 'Transfer successful',
                description: (
                        <div>
                            <p>
                                {transferAmount} STRK transfered to {transferAddress.slice(0, 10)}…{transferAddress.slice(-5)}
                            </p>
                            <a
                                href={`https://sepolia.starkscan.co/tx/${tx.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-200 hover:text-white"
                            >
                                Transaction details
                            </a>
                        </div>
                    ),
                variant: 'success'
            })
        } catch (error) {
            setIsTransfering(false)
            console.error('Transfer failed:', error)
            toast({
                title: 'Transfer failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'destructive'
            })
        } finally {
            setIsTransfering(false)
        }
    }

    const handleWithdraw = async () => {
        if (!withdrawAmount || !withdrawAddress) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all fields before withdrawing.',
                variant: 'destructive'
            })
            return
        }

        setIsWithdrawing(true)

        try {
            toast({
                title: 'Withdrawal Initiated',
                description: `Withdrawing ${withdrawAmount} STRK to ${withdrawAddress.slice(0, 10)}...${withdrawAddress.slice(-5)}`
            })

            const requiredAmount = BigInt(withdrawAmount * 1e18)
            const availableUtxos = utxos || []

            // Sort smallest UTXOs first
            const sortedUtxos = availableUtxos.sort((a, b) =>
                Number(BigInt(a.amount) / BigInt(1e18) - BigInt(b.amount) / BigInt(1e18))
            )

            const selectedUtxos: Utxo[] = []
            let totalSelected = 0n

            for (const utxo of sortedUtxos) {
                selectedUtxos.push(utxo)
                totalSelected += BigInt(utxo.amount)
                if (totalSelected >= requiredAmount) break
            }

            if (totalSelected < requiredAmount) {
                toast({
                    title: 'Insufficient Funds',
                    description: 'Your available UTXOs cannot cover the withdrawal amount.',
                    variant: 'destructive'
                })
                return
            }

            const outputs: Utxo[] = []

            const change = totalSelected - requiredAmount
            if (change > 0n) {
                const changeUtxo = new Utxo({
                    amount: change,
                    keypair
                })
                outputs.push(changeUtxo)
            }

            const tx = await transaction({
                obscura,
                provider,
                inputs: selectedUtxos,
                outputs,
                recipient: withdrawAddress
            })

            toast({
                title: 'Withdrawal successful',
                description: (
                        <div>
                            <p>
                                {withdrawAmount} STRK withdrawn to {withdrawAddress.slice(0, 10)}…{withdrawAddress.slice(-5)}
                            </p>
                            <a
                                href={`https://sepolia.starkscan.co/tx/${tx.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-200 hover:text-white"
                            >
                                Transaction details
                            </a>
                        </div>
                    ),
                variant: 'success'
            })

            setWithdrawAmount(0)
            setWithdrawAddress('')
        } catch (error) {
            setIsWithdrawing(false)
            console.error('Withdrawal failed:', error)
            toast({
                title: 'Withdrawal failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'destructive'
            })
        } finally {
            setIsWithdrawing(false)
        }
    }

    const handleMaxFund = async () => {
        if (!address || !keypair) {
            toast({
                title: 'Account Not Connected',
                description: 'Please connect your wallet or private key.',
                variant: 'destructive'
            })

            return
        }

        const userBalance = await strk.balance_of(address)
        if (userBalance <= 0n || !userBalance)
            toast({
                title: 'Invalid Balance',
                description: 'Your balance is too low.',
                variant: 'destructive'
            })
        else setFundAmount(Number(userBalance / BigInt(1e18)))
    }

    const handleMaxTransfer = async () => {
        if (!address || !keypair) {
            toast({
                title: 'Account Not Connected',
                description: 'Please connect your wallet or private key.',
                variant: 'destructive'
            })

            return
        }

        if (balance <= 0n || !balance)
            toast({
                title: 'Invalid Shielded Balance',
                description: 'Your shielded balance is too low.',
                variant: 'destructive'
            })
        else setTransferAmount(balance)
    }

    const handleMaxWithdrawal = async () => {
        if (!address || !keypair) {
            toast({
                title: 'Account Not Connected',
                description: 'Please connect your wallet or private key.',
                variant: 'destructive'
            })

            return
        }

        if (balance <= 0n || !balance)
            toast({
                title: 'Invalid Shielded Balance',
                description: 'Your shielded balance is too low.',
                variant: 'destructive'
            })
        else setWithdrawAmount(balance)
    }

    const setPredefinedAmount = (amount: number) => {
        setWithdrawAmount(amount)
    }

    return (
        <div
            className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-black' : 'bg-white'
            }`}
        >
            {/* Artistic Background Composition */}
            {isArt && (
                <div className="absolute inset-0">
                    {/* Pattern 0: Flowing Gradients */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-1000 ${currentPattern === 0 ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-500 to-white transform rotate-12 scale-150"></div>
                        <div className="absolute inset-0 bg-gradient-to-tl from-white via-gray-300 to-black transform -rotate-12 scale-150 mix-blend-multiply"></div>
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-black to-transparent rounded-full animate-pulse opacity-60"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-white to-transparent rounded-full animate-pulse opacity-80 delay-1000"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black to-transparent opacity-30 animate-pulse delay-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent opacity-40 animate-pulse delay-1500"></div>
                    </div>

                    {/* Pattern 1: Sharp Boundaries */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-1000 ${currentPattern === 1 ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="absolute inset-0 bg-black transform origin-center rotate-45 translate-x-1/2"></div>
                        <div className="absolute inset-0 bg-white"></div>
                        <div className="absolute top-0 left-0 w-1/3 h-full bg-black"></div>
                        <div className="absolute top-1/3 right-0 w-1/2 h-1/3 bg-white border-4 border-black"></div>
                        <div className="absolute bottom-0 left-1/4 w-1/2 h-1/4 bg-black"></div>
                        <div className="absolute inset-0">
                            <svg
                                className="w-full h-full"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                <polygon points="0,0 20,50 0,100 40,100 60,50 40,0" fill="black" />
                                <polygon
                                    points="40,0 60,50 40,100 80,100 100,50 80,0"
                                    fill="white"
                                />
                                <polygon points="20,50 40,0 60,50 40,100" fill="black" />
                            </svg>
                        </div>
                    </div>

                    {/* Pattern 2: Organic Forms */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-1000 ${currentPattern === 2 ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="absolute inset-0 bg-white"></div>
                        <div
                            className="absolute top-1/4 left-1/4 w-96 h-96 bg-black rounded-full transform scale-150 animate-pulse"
                            style={{ clipPath: 'ellipse(60% 40% at 30% 70%)' }}
                        ></div>
                        <div
                            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-black rounded-full transform animate-pulse delay-1000"
                            style={{ clipPath: 'ellipse(80% 60% at 70% 30%)' }}
                        ></div>
                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M0,20 Q25,5 50,20 T100,20 L100,40 Q75,55 50,40 T0,40 Z"
                                fill="black"
                                opacity="0.8"
                            />
                            <path
                                d="M0,60 Q25,45 50,60 T100,60 L100,80 Q75,95 50,80 T0,80 Z"
                                fill="black"
                                opacity="0.6"
                            />
                        </svg>
                        <div
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-black rounded-full opacity-70"
                            style={{
                                clipPath:
                                    'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)'
                            }}
                        ></div>
                    </div>

                    {/* Pattern 3: Geometric Patterns */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-1000 ${currentPattern === 3 ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="absolute inset-0 bg-white"></div>
                        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                            {Array.from({ length: 64 }, (_, i) => (
                                <div
                                    key={i}
                                    className={`${(Math.floor(i / 8) + i) % 2 === 0 ? 'bg-black' : 'bg-white'} transition-all duration-2000 hover:scale-110`}
                                    style={{
                                        animationDelay: `${i * 50}ms`,
                                        animation: isAnimated ? 'pulse 3s infinite' : 'none'
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <div
                                    className="w-64 h-64 border-8 border-black rounded-full animate-spin"
                                    style={{ animationDuration: '20s' }}
                                ></div>
                                <div
                                    className="absolute top-8 left-8 w-48 h-48 border-8 border-white rounded-full animate-spin"
                                    style={{
                                        animationDuration: '15s',
                                        animationDirection: 'reverse'
                                    }}
                                ></div>
                                <div className="absolute top-16 left-16 w-32 h-32 bg-black rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Pattern 4: Ripple Effects */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-1000 ${currentPattern === 4 ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-radial from-white via-gray-500 to-black"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {Array.from({ length: 8 }, (_, i) => (
                                <div
                                    key={i}
                                    className="absolute border-2 border-black rounded-full animate-ping"
                                    style={{
                                        width: `${(i + 1) * 80}px`,
                                        height: `${(i + 1) * 80}px`,
                                        animationDelay: `${i * 0.5}s`,
                                        animationDuration: '4s',
                                        opacity: 1 - i * 0.1
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="absolute top-1/4 left-1/4">
                            {Array.from({ length: 6 }, (_, i) => (
                                <div
                                    key={i}
                                    className="absolute border-2 border-white rounded-full animate-ping"
                                    style={{
                                        width: `${(i + 1) * 60}px`,
                                        height: `${(i + 1) * 60}px`,
                                        animationDelay: `${i * 0.3}s`,
                                        animationDuration: '3s',
                                        opacity: 0.8 - i * 0.1
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="absolute bottom-1/4 right-1/4">
                            {Array.from({ length: 6 }, (_, i) => (
                                <div
                                    key={i}
                                    className="absolute border-2 border-black rounded-full animate-ping"
                                    style={{
                                        width: `${(i + 1) * 60}px`,
                                        height: `${(i + 1) * 60}px`,
                                        animationDelay: `${i * 0.4}s`,
                                        animationDuration: '3.5s',
                                        opacity: 0.7 - i * 0.1
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Obscura on the left */}
            <Header currentPattern={currentPattern} controlStyles={controlStyles} />

            <div className="absolute bottom-6 left-6 z-50">
                <Button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    variant="outline"
                    className={`${controlStyles.bg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.secondaryHover} transition-all duration-200 mb-2 mr-2`}
                >
                    {theme === 'dark' ? (
                        <Sun className={`w-5 h-5 ${controlStyles.text}`} />
                    ) : (
                        <Moon className={`w-5 h-5 ${controlStyles.text}`} />
                    )}
                    {/* <span className={`${controlStyles.text} font-semibold text-sm`}>Toggle theme</span> */}
                </Button>
                {isRegistered && (
                    <Button
                        onClick={() => setIsSettingsOpen(true)}
                        variant="outline"
                        className={`${controlStyles.bg} ${controlStyles.buttonText} border ${controlStyles.border} ${controlStyles.secondaryHover} transition-all duration-200 mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                        <Settings className={`w-5 h-5 ${controlStyles.text}`} />
                    </Button>
                )}
                {/* Adaptive Art Control Panel */}
                <div
                    className={`${controlStyles.bg} backdrop-blur-sm border ${controlStyles.border} rounded-lg shadow-lg overflow-hidden transition-all duration-500`}
                >
                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsArtControlOpen(!isArtControlOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 ${controlStyles.secondaryHover} transition-colors`}
                    >
                        <div className="flex items-center gap-3">
                            <Palette className={`w-5 h-5 ${controlStyles.text}`} />
                            <span className={`${controlStyles.text} font-semibold text-sm`}>
                                Art Control
                            </span>
                        </div>
                        {isArtControlOpen ? (
                            <ChevronUp className={`w-4 h-4 ml-2 ${controlStyles.text}`} />
                        ) : (
                            <ChevronDown className={`w-4 h-4 ml-2 ${controlStyles.text}`} />
                        )}
                    </button>

                    {/* Collapsible Content */}
                    {isArtControlOpen && (
                        <div className={`px-4 pb-4 space-y-3 border-t ${controlStyles.border}`}>
                            <div className="flex flex-wrap gap-2 pt-3">
                                <button
                                    onClick={() => setIsAnimated(!isAnimated)}
                                    className={`flex items-center gap-2 px-3 py-2 ${controlStyles.buttonBg} ${controlStyles.buttonText} rounded-lg ${controlStyles.buttonHover} transition-colors text-xs`}
                                >
                                    {isAnimated ? (
                                        <Pause className="w-3 h-3" />
                                    ) : (
                                        <Play className="w-3 h-3" />
                                    )}
                                </button>
                                <button
                                    onClick={() =>
                                        setCurrentPattern(prev => (prev + 1) % patterns.length)
                                    }
                                    className={`flex items-center gap-2 px-3 py-2 ${controlStyles.secondaryBg} ${controlStyles.secondaryText} border ${controlStyles.border} rounded-lg ${controlStyles.secondaryHover} transition-colors text-xs`}
                                >
                                    <TrackNextIcon className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => setIsArt(prev => !prev)}
                                    className={`flex items-center gap-2 px-3 py-2 ${controlStyles.secondaryBg} ${controlStyles.secondaryText} border ${controlStyles.border} rounded-lg ${controlStyles.secondaryHover} transition-colors text-xs`}
                                >
                                    {isArt ? (
                                        <Bot className="w-3 h-3" />
                                    ) : (
                                        <BotOff className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                            <div className={`text-xs ${controlStyles.text} opacity-75`}>
                                {patterns[currentPattern]}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen z-10">
                <Card
                    className={`w-full max-w-2xl backdrop-blur-xl border shadow-2xl transition-all duration-300 ${
                        isDarkMode
                            ? 'bg-black/30 border-white/20 shadow-black/50'
                            : 'bg-white/30 border-black/20 shadow-black/20'
                    } ${isModalOpen ? 'hidden' : 'block'}`}
                >
                    <CardContent className="space-y-6 pt-6">
                        <Tabs defaultValue="fund" className="w-full">
                            <TabsList
                                className={`grid w-full grid-cols-3 backdrop-blur-sm border transition-colors duration-200 ${
                                    isDarkMode
                                        ? 'bg-black/20 border-white/20'
                                        : 'bg-white/20 border-black/20'
                                }`}
                            >
                                <TabsTrigger
                                    value="fund"
                                    className={`transition-all duration-200 ${
                                        isDarkMode
                                            ? 'data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300'
                                            : 'data-[state=active]:bg-black/20 data-[state=active]:text-black text-gray-700'
                                    }`}
                                >
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Fund
                                </TabsTrigger>
                                <TabsTrigger
                                    value="transfer"
                                    className={`transition-all duration-200 ${
                                        isDarkMode
                                            ? 'data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300'
                                            : 'data-[state=active]:bg-black/20 data-[state=active]:text-black text-gray-700'
                                    }`}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Transfer
                                </TabsTrigger>
                                <TabsTrigger
                                    value="withdraw"
                                    className={`transition-all duration-200 ${
                                        isDarkMode
                                            ? 'data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300'
                                            : 'data-[state=active]:bg-black/20 data-[state=active]:text-black text-gray-700'
                                    }`}
                                >
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    Withdraw
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="fund" className="space-y-6 mt-6">
                                <div
                                    className={`space-y-4 p-6 rounded-xl backdrop-blur-sm border transition-colors duration-200 ${
                                        isDarkMode
                                            ? 'bg-black/10 border-white/10'
                                            : 'bg-white/10 border-black/10'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label
                                                htmlFor="fund-amount"
                                                className={`font-medium ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}
                                            >
                                                Amount
                                            </Label>
                                            <span
                                                className="cursor-pointer"
                                                onClick={handleMaxFund}
                                            >
                                                Max
                                            </span>
                                        </div>
                                        <Input
                                            id="fund-amount"
                                            type="number"
                                            placeholder="Enter amount..."
                                            value={fundAmount == 0 ? '' : fundAmount}
                                            onChange={e => setFundAmount(Number(e.target.value))}
                                            className={`backdrop-blur-sm border transition-colors duration-200 ${
                                                isDarkMode
                                                    ? 'bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:border-white/40'
                                                    : 'bg-white/20 border-black/20 text-black placeholder:text-gray-600 focus:ring-black/30 focus:border-black/40'
                                            }`}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="fund-address"
                                            className={`font-medium ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                        >
                                            Recipient Address
                                        </Label>
                                        <Input
                                            id="fund-address"
                                            placeholder="Enter wallet address..."
                                            value={fundAddress}
                                            onChange={e => setFundAddress(e.target.value)}
                                            className={`backdrop-blur-sm border transition-colors duration-200 ${
                                                isDarkMode
                                                    ? 'bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:border-white/40'
                                                    : 'bg-white/20 border-black/20 text-black placeholder:text-gray-600 focus:ring-black/30 focus:border-black/40'
                                            }`}
                                        />
                                    </div>

                                    {!isApproved ? (
                                        <Button
                                            onClick={handleApproveStrk}
                                            className={`w-full font-semibold py-3 transition-all duration-200 transform hover:scale-105 ${
                                                isDarkMode
                                                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                                                    : 'bg-black/15 hover:bg-black/25 text-black border border-black/20'
                                            }`}
                                            disabled={isApproving || isApproved || !isRegistered}
                                        >
                                            <ArrowDownLeft className="w-4 h-4 mr-2" />
                                            {isApproving ? 'Approving...' : 'Approve'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() =>
                                                isApproved ? handleFund() : handleApproveStrk()
                                            }
                                            className={`w-full font-semibold py-3 transition-all duration-200 transform hover:scale-105 ${
                                                isDarkMode
                                                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                                                    : 'bg-black/15 hover:bg-black/25 text-black border border-black/20'
                                            }`}
                                            disabled={isFunding || !isRegistered}
                                        >
                                            <ArrowDownLeft className="w-4 h-4 mr-2" />
                                            {isFunding ? 'Initiating Fund...' : 'Initiate Fund'}
                                        </Button>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="transfer" className="space-y-6 mt-6">
                                <div
                                    className={`space-y-4 p-6 rounded-xl backdrop-blur-sm border transition-colors duration-200 ${
                                        isDarkMode
                                            ? 'bg-black/10 border-white/10'
                                            : 'bg-white/10 border-black/10'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label
                                                htmlFor="fund-amount"
                                                className={`font-medium ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}
                                            >
                                                Amount
                                            </Label>
                                            <span
                                                className="cursor-pointer"
                                                onClick={handleMaxTransfer}
                                            >
                                                Max
                                            </span>
                                        </div>
                                        <Input
                                            id="transfer-amount"
                                            type="number"
                                            placeholder="Enter amount..."
                                            value={transferAmount == 0 ? '' : transferAmount}
                                            onChange={e =>
                                                setTransferAmount(Number(e.target.value))
                                            }
                                            className={`backdrop-blur-sm border transition-colors duration-200 ${
                                                isDarkMode
                                                    ? 'bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:border-white/40'
                                                    : 'bg-white/20 border-black/20 text-black placeholder:text-gray-600 focus:ring-black/30 focus:border-black/40'
                                            }`}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="transfer-address"
                                            className={`font-medium ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                        >
                                            Recipient Address
                                        </Label>
                                        <Input
                                            id="transfer-address"
                                            placeholder="Enter shielded address..."
                                            value={transferAddress}
                                            onChange={e => setTransferAddress(e.target.value)}
                                            className={`backdrop-blur-sm border transition-colors duration-200 ${
                                                isDarkMode
                                                    ? 'bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:border-white/40'
                                                    : 'bg-white/20 border-black/20 text-black placeholder:text-gray-600 focus:ring-black/30 focus:border-black/40'
                                            }`}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleTransfer}
                                        className={`w-full font-semibold py-3 transition-all duration-200 transform hover:scale-105 ${
                                            isDarkMode
                                                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                                                : 'bg-black/15 hover:bg-black/25 text-black border border-black/20'
                                        }`}
                                        disabled={isTransfering || !isRegistered}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {isTransfering ? 'Transfering...' : 'Initiate Transfer'}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="withdraw" className="space-y-6 mt-6">
                                <div
                                    className={`space-y-4 p-6 rounded-xl backdrop-blur-sm border transition-colors duration-200 ${
                                        isDarkMode
                                            ? 'bg-black/10 border-white/10'
                                            : 'bg-white/10 border-black/10'
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <Label
                                            className={`font-medium ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                        >
                                            Quick Select
                                        </Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {predefinedAmounts.map(amount => {
                                                const isSelected = amount === clickedAmount
                                                return (
                                                    <Button
                                                        key={amount}
                                                        variant="outline"
                                                        onClick={() => {
                                                            setPredefinedAmount(amount)
                                                            setClickedAmount(amount)
                                                        }}
                                                        className={`backdrop-blur-sm border transition-all duration-200 ${
                                                            isDarkMode
                                                                ? isSelected
                                                                    ? 'bg-white/20 border-white/30 text-white'
                                                                    : 'bg-black/20 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                                                                : isSelected
                                                                  ? 'bg-black/20 border-black/30 text-black'
                                                                  : 'bg-white/20 border-black/20 text-black hover:bg-black/20 hover:border-black/30'
                                                        }`}
                                                    >
                                                        {amount} STRK
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label
                                                htmlFor="fund-amount"
                                                className={`font-medium ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}
                                            >
                                                Amount
                                            </Label>
                                            <span
                                                className="cursor-pointer"
                                                onClick={handleMaxWithdrawal}
                                            >
                                                Max
                                            </span>
                                        </div>
                                        <Input
                                            id="withdraw-amount"
                                            type="number"
                                            placeholder="Enter amount..."
                                            value={withdrawAmount == 0 ? '' : withdrawAmount}
                                            onChange={e =>
                                                setWithdrawAmount(Number(e.target.value))
                                            }
                                            className={`backdrop-blur-sm border transition-colors duration-200 ${
                                                isDarkMode
                                                    ? 'bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:border-white/40'
                                                    : 'bg-white/20 border-black/20 text-black placeholder:text-gray-600 focus:ring-black/30 focus:border-black/40'
                                            }`}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="withdraw-address"
                                            className={`font-medium ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                        >
                                            Recipient Address
                                        </Label>
                                        <Input
                                            id="withdraw-address"
                                            placeholder="Enter wallet address..."
                                            value={withdrawAddress}
                                            onChange={e => setWithdrawAddress(e.target.value)}
                                            className={`backdrop-blur-sm border transition-colors duration-200 ${
                                                isDarkMode
                                                    ? 'bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:border-white/40'
                                                    : 'bg-white/20 border-black/20 text-black placeholder:text-gray-600 focus:ring-black/30 focus:border-black/40'
                                            }`}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleWithdraw}
                                        className={`w-full font-semibold py-3 transition-all duration-200 transform hover:scale-105 ${
                                            isDarkMode
                                                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                                                : 'bg-black/15 hover:bg-black/25 text-black border border-black/20'
                                        }`}
                                        disabled={!isRegistered || isWithdrawing}
                                    >
                                        <ArrowUpRight className="w-4 h-4 mr-2" />

                                        {isWithdrawing
                                            ? 'Initiating Withdrawal...'
                                            : 'Initiate Withdrawal'}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
            <SettingsModal isOpen={isSettinngsOpen} onClose={closeSettingsModal} />
        </div>
    )
}

export default Index
