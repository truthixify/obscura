
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
    Sun,
    Moon,
    Settings,
} from 'lucide-react'
import { useToast } from '../../hooks/use-toast'
import { Header } from '../header'
import { useTheme } from 'next-themes'
import { generateTransactionCall, transaction } from '../../utils/index'
import Utxo from '../../utils/utxo'
import { useScaffoldContract } from '../../hooks/scaffold-stark/useScaffoldContract'
import { useAccount, useProvider, usePaymasterSendTransaction } from '@starknet-react/core'
import { Account, FeeMode } from 'starknet'
import { useBalanceStore } from '../../stores/balance-store'
import { useKeypairStore } from '../../stores/keypair-store'
import { generateKeypairFromSignature, signMessage } from '../../utils/utils'
import { AccountData, buildTypedData, executeSponsoredTransaction, getAccount } from '../../lib/api'
import { useAccountStore } from '../../stores/account-store'
import { Keypair } from '../../utils/keypair'
import SettingsModal from './settings'
import { useModalStore } from '../../stores/modal-store'
import { useUtxoStore } from '../../stores/utxo-store'

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

    const isDarkMode = theme == 'dark'

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
                token_address: strk?.address,
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
                                {fundAmount} STRK deposited to {fundAddress.slice(0, 10)}…
                                {fundAddress.slice(-5)}
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

    // const feeMode: FeeMode = {
    //     mode: "sponsored",// default or sponsored(need api-key)
    // }
    // const { sendAsync: paymasterSendTransaction, error } = usePaymasterSendTransaction({
    //     options: {
    //         feeMode,
    //     },
    // });

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

            const accounts = await getAccount({ address: receiverKeypair.address() })

            if (!accounts.owner) {
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
                token_address: strk?.address,
                inputs: selectedUtxos,
                outputs
            })

            // TODO: use paymaster to sign transaction and pay the fee
            // const calls = await generateTransactionCall({
            //     obscura,
            //     provider,
            //     inputs: selectedUtxos,
            //     outputs
            // })
            // console.log(calls)
            // setCalls(calls)
            // const typedData = await buildTypedData(address, calls)
            // console.log(typedData)
            // const signature = await signMessage(account as Account, typedData)
            // signature.
            // console.log(signature)
            // const exec = await executeSponsoredTransaction(address, typedData, signature)
            // console.log(exec)
            
            // const tx = await paymasterSendTransaction(calls)
            // console.log(tx)

            toast({
                title: 'Transfer successful',
                description: (
                    <div>
                        <p>
                            {transferAmount} STRK transfered to {transferAddress.slice(0, 10)}…
                            {transferAddress.slice(-5)}
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
                token_address: strk?.address,
                inputs: selectedUtxos,
                outputs,
                recipient: withdrawAddress
            })

            toast({
                title: 'Withdrawal successful',
                description: (
                    <div>
                        <p>
                            {withdrawAmount} STRK withdrawn to {withdrawAddress.slice(0, 10)}…
                            {withdrawAddress.slice(-5)}
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

            {/* Header with Obscura on the left */}
            <Header />

            <div className="absolute bottom-6 left-6 z-50">
                <Button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    variant="outline"
                    className={`transition-all duration-200 mb-2 mr-2`}
                >
                    {theme === 'dark' ? (
                        <Sun className={`w-5 h-5`} />
                    ) : (
                        <Moon className={`w-5 h-5`} />
                    )}
                </Button>
                {isRegistered && (
                    <Button
                        onClick={() => setIsSettingsOpen(true)}
                        variant="outline"
                        className={`transition-all duration-200 mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                        <Settings className={`w-5 h-5`} />
                    </Button>
                )}
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
                                                className={`font-medium ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                } cursor-pointer`}
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
                                                className={`font-medium ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                } cursor-pointer`}
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
                                                className={`font-medium ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                } cursor-pointer`}
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
