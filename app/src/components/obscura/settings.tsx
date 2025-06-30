import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Label } from '../ui/label'
import { Copy, Download, Wallet, X } from 'lucide-react'
import { useToast } from '../../hooks/use-toast'
import { useTheme } from 'next-themes'
import { useBalanceStore } from '../../stores/balance-store'
import { useKeypairStore } from '../../stores/keypair-store'
import { useAccount } from '@starknet-react/core'
import { downloadPrivateKeyFile } from '../../lib/download-private-key-file'

const SettingsModal = ({ isOpen, onClose }) => {
    const { toast } = useToast()
    const { theme } = useTheme()
    const { balance } = useBalanceStore()
    const { keypair } = useKeypairStore()
    const { address } = useAccount()
    const [isCopied, setIsCopied] = useState(false)

    const isDarkMode = theme === 'dark'

    const controlStyles = {
        bg: isDarkMode ? 'bg-black/30' : 'bg-white/30',
        border: isDarkMode ? 'border-white/20' : 'border-black/20',
        text: isDarkMode ? 'text-gray-300' : 'text-gray-700',
        buttonBg: isDarkMode ? 'bg-white/20' : 'bg-black/15',
        buttonHover: isDarkMode ? 'hover:bg-white/30' : 'hover:bg-black/25',
        buttonBorder: isDarkMode ? 'border-white/20' : 'border-black/20',
        inputBg: isDarkMode ? 'bg-black/20' : 'bg-white/20',
        inputBorder: isDarkMode ? 'border-white/20' : 'border-black/20',
        inputFocus: isDarkMode
            ? 'focus:ring-white/30 focus:border-white/40'
            : 'focus:ring-black/30 focus:border-black/40',
        placeholder: isDarkMode ? 'placeholder:text-gray-400' : 'placeholder:text-gray-600'
    }

    const handleCopyKey = async () => {
        if (!keypair) {
            toast({
                title: 'No Key Available',
                description: 'Please generate a keypair first.',
                variant: 'destructive'
            })
            return
        }

        try {
            await navigator.clipboard.writeText(keypair.toString())
            setIsCopied(true)
            toast({
                title: 'Key Copied',
                description: 'Private key copied to clipboard.',
                variant: 'success'
            })
            setTimeout(() => setIsCopied(false), 2000)
        } catch (error) {
            toast({
                title: 'Copy Failed',
                description: 'Failed to copy private key.',
                variant: 'destructive'
            })
        }
    }

    const handleDownloadKey = async () => {
        if (!keypair) {
            toast({
                title: 'No Key Available',
                description: 'Please generate a keypair first.',
                variant: 'destructive'
            })
            return
        }

        const filename = `obscura-key-file-${address.slice(0, 8)}`
        const content = keypair.privkey

        await downloadPrivateKeyFile(filename, content)
    }

    if (!isOpen) return null

    return (
        <div className={`fixed inset-0 z-50 px-2 flex items-center justify-center ${isDarkMode ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-sm`}>
            <Card
                className={`w-full max-w-md ${controlStyles.bg} ${controlStyles.border} shadow-2xl transition-all duration-300`}
            >
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className={`text-xl font-semibold ${controlStyles.text}`}>Settings</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className={`${controlStyles.buttonBg} ${controlStyles.buttonBorder} ${controlStyles.buttonHover}`}
                        >
                            <X className={`w-5 h-5 ${controlStyles.text}`} />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="wallet-address"
                                className={`font-medium ${controlStyles.text}`}
                            >
                                Wallet Address
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="wallet-address"
                                    value={address || 'No wallet connected'}
                                    readOnly
                                    className={`backdrop-blur-sm ${controlStyles.inputBg} ${controlStyles.inputBorder} ${controlStyles.placeholder} ${controlStyles.text} cursor-not-allowed`}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        if (address) {
                                            navigator.clipboard.writeText(address)
                                            toast({
                                                title: 'Address Copied',
                                                description: 'Wallet address copied to clipboard.',
                                                variant: 'success'
                                            })
                                        }
                                    }}
                                    disabled={!address}
                                    className={`${controlStyles.buttonBg} ${controlStyles.buttonBorder} ${controlStyles.buttonHover}`}
                                >
                                    <Copy className={`w-4 h-4 ${controlStyles.text}`} />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="wallet-address"
                                className={`font-medium ${controlStyles.text}`}
                            >
                                Shielded Pool Address
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="wallet-address"
                                    value={keypair.address() || 'No wallet connected'}
                                    readOnly
                                    className={`backdrop-blur-sm ${controlStyles.inputBg} ${controlStyles.inputBorder} ${controlStyles.placeholder} ${controlStyles.text} cursor-not-allowed`}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        if (address) {
                                            navigator.clipboard.writeText(keypair.address())
                                            toast({
                                                title: 'Shield Pool Address Copied',
                                                description: 'Wallet address copied to clipboard.',
                                                variant: 'success'
                                            })
                                        }
                                    }}
                                    disabled={!address}
                                    className={`${controlStyles.buttonBg} ${controlStyles.buttonBorder} ${controlStyles.buttonHover}`}
                                >
                                    <Copy className={`w-4 h-4 ${controlStyles.text}`} />
                                </Button>
                            </div>
                        </div>

                        
                        <div className="space-y-2">
                            <Label
                                htmlFor="balance"
                                className={`font-medium ${controlStyles.text}`}
                            >
                                Shielded Pool Balance
                            </Label>
                            <Input
                                id="balance"
                                value={`${balance} STRK`}
                                readOnly
                                className={`backdrop-blur-sm ${controlStyles.inputBg} ${controlStyles.inputBorder} ${controlStyles.placeholder} ${controlStyles.text} cursor-not-allowed`}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="private-key"
                                className={`font-medium ${controlStyles.text}`}
                            >
                                Private Key
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="private-key"
                                    value={keypair.privkey ? '••••••••••••••••' : 'No key available'}
                                    readOnly
                                    className={`backdrop-blur-sm ${controlStyles.inputBg} ${controlStyles.inputBorder} ${controlStyles.placeholder} ${controlStyles.text} cursor-not-allowed`}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopyKey}
                                    disabled={!keypair}
                                    className={`${controlStyles.buttonBg} ${controlStyles.buttonBorder} ${controlStyles.buttonHover}`}
                                >
                                    <Copy className={`w-4 h-4 ${controlStyles.text}`} />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleDownloadKey}
                                    disabled={!keypair}
                                    className={`${controlStyles.buttonBg} ${controlStyles.buttonBorder} ${controlStyles.buttonHover}`}
                                >
                                    <Download className={`w-4 h-4 ${controlStyles.text}`} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Button
                        className={`w-full font-semibold py-3 transition-all duration-200 transform hover:scale-105 ${controlStyles.buttonBg} ${controlStyles.buttonBorder} ${controlStyles.buttonHover} ${controlStyles.text}`}
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default SettingsModal
