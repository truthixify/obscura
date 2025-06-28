import { useRef, useState } from 'react'
import { NetworkOptions } from './NetworkOptions'
import { useLocalStorage } from 'usehooks-ts'
import { BlockieAvatar, isENS } from '../../scaffold-stark'
import { useOutsideClick } from '../../../hooks/scaffold-stark'
import { BurnerConnector, burnerAccounts } from '@scaffold-stark/stark-burner'
import { Address } from '@starknet-react/chains'
import { useDisconnect, useNetwork, useConnect } from '@starknet-react/core'
import { getStarknetPFPIfExists } from '../../../utils/profile'
import { useScaffoldStarkProfile } from '../../../hooks/scaffold-stark/useScaffoldStarkProfile'
// import { useTheme } from 'next-themes'
import {
    ArrowLeftFromLine,
    CheckCircle,
    ChevronDown,
    Copy,
    ExternalLink,
    UserCircle,
    X
} from 'lucide-react'
import { usePlayerStore } from '../../../stores/playerStore'

// const allowedNetworks = getTargetNetworks()

type AddressInfoDropdownProps = {
    address: Address
    blockExplorerAddressLink: string | undefined
    displayName: string
    ensAvatar?: string
}

export const AddressInfoDropdown = ({
    address,
    ensAvatar,
    displayName,
    blockExplorerAddressLink
}: AddressInfoDropdownProps) => {
    const { disconnect } = useDisconnect()
    const [addressCopied, setAddressCopied] = useState(false)
    const { data: profile } = useScaffoldStarkProfile(address)
    const { chain } = useNetwork()
    const [showBurnerAccounts, setShowBurnerAccounts] = useState(false)
    const [selectingNetwork, setSelectingNetwork] = useState(false)
    const { connectors, connect } = useConnect()
    // const { resolvedTheme } = useTheme()
    const { playerName } = usePlayerStore()
    // const isDarkMode = resolvedTheme === 'dark'
    const dropdownRef = useRef<HTMLDetailsElement>(null)
    const closeDropdown = () => {
        setSelectingNetwork(false)
        dropdownRef.current?.removeAttribute('open')
    }

    useOutsideClick(dropdownRef, closeDropdown)

    function handleConnectBurner(_: React.MouseEvent<HTMLButtonElement>, ix: number) {
        const connector = connectors.find(it => it.id == 'burner-wallet')
        if (connector && connector instanceof BurnerConnector) {
            connector.burnerAccount = burnerAccounts[ix]
            connect({ connector })
            setLastConnector({ id: connector.id, ix })
            setShowBurnerAccounts(false)
        }
    }

    const [_, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
        'lastUsedConnector',
        { id: '' },
        {
            initializeWithValue: false
        }
    )

    // Handle copy address
    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address)
            setAddressCopied(true)
            setTimeout(() => {
                setAddressCopied(false)
            }, 800)
        }
    }

    return (
        <>
            <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
                <summary
                    tabIndex={0}
                    className="retro-button retro-button-outline py-1 px-3 flex items-center gap-2 cursor-pointer list-none"
                >
                    <div className="hidden sm:block">
                        {getStarknetPFPIfExists(profile?.profilePicture) ? (
                            <img
                                src={profile?.profilePicture || ''}
                                alt="Profile Picture"
                                className="rounded-full"
                                width={30}
                                height={30}
                            />
                        ) : (
                            <BlockieAvatar address={address} size={28} ensImage={ensAvatar} />
                        )}
                    </div>
                    <span className="ml-2 mr-2 text-sm font-bold">
                        {playerName
                            ? playerName
                            : isENS(displayName)
                              ? displayName
                              : profile?.name || address?.slice(0, 6) + '...' + address?.slice(-4)}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                </summary>

                <ul className="absolute right-0 mt-2 w-56 retro-card p-2 z-50 shadow-cartoon">
                    <NetworkOptions hidden={!selectingNetwork} />

                    <li className={`${selectingNetwork ? 'hidden' : ''} mb-2`}>
                        <button
                            onClick={copyAddress}
                            className="retro-button retro-button-outline w-full py-2 px-3 flex items-center gap-2 text-sm"
                        >
                            {addressCopied ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            <span className="whitespace-nowrap">
                                {addressCopied ? 'Copied!' : 'Copy address'}
                            </span>
                        </button>
                    </li>
                    {chain.network !== 'devnet' && (
                        <li className={`${selectingNetwork ? 'hidden' : ''} mb-2`}>
                            <a
                                href={blockExplorerAddressLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="retro-button retro-button-outline w-full py-2 px-3 flex items-center gap-2 text-sm"
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span className="whitespace-nowrap">View on Explorer</span>
                            </a>
                        </li>
                    )}

                    {chain.network === 'devnet' && (
                        <li className={`${selectingNetwork ? 'hidden' : ''} mb-2`}>
                            <button
                                className="retro-button retro-button-outline w-full py-2 px-3 flex items-center gap-2 text-sm"
                                onClick={() => setShowBurnerAccounts(true)}
                            >
                                <UserCircle className="h-4 w-4" />
                                <span className="whitespace-nowrap">Switch Account</span>
                            </button>
                        </li>
                    )}

                    <li className={selectingNetwork ? 'hidden' : ''}>
                        <button
                            className="retro-button retro-button-primary w-full py-2 px-3 flex items-center gap-2 text-sm"
                            onClick={() => disconnect()}
                        >
                            <ArrowLeftFromLine className="h-4 w-4" />
                            <span>Disconnect</span>
                        </button>
                    </li>
                </ul>
            </details>

            {/* Burner Accounts Modal */}
            {showBurnerAccounts && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                        onClick={() => setShowBurnerAccounts(false)}
                    ></div>

                    <div className="retro-card max-w-md w-full z-10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Choose Account</h2>
                            <button
                                onClick={() => setShowBurnerAccounts(false)}
                                className="retro-button retro-button-outline p-2"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {burnerAccounts.map((burnerAcc, ix) => (
                                <button
                                    key={burnerAcc.publicKey}
                                    className="retro-button retro-button-outline w-full mb-2 py-2 px-3 flex items-center gap-3"
                                    onClick={e => handleConnectBurner(e, ix)}
                                >
                                    <BlockieAvatar address={burnerAcc.accountAddress} size={28} />
                                    <span>{`${burnerAcc.accountAddress.slice(0, 6)}...${burnerAcc.accountAddress.slice(-4)}`}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
