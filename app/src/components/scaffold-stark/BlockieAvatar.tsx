import { blo } from 'blo'

interface BlockieAvatarProps {
    address: string
    ensImage?: string | null
    size: number
}

// Custom Avatar for RainbowKit
export const BlockieAvatar = ({ address, ensImage, size }: BlockieAvatarProps) => (
    <img
        className="rounded-full"
        src={ensImage || blo(address as `0x${string}`)}
        width={size}
        height={size}
        alt={`${address} avatar`}
    />
)
