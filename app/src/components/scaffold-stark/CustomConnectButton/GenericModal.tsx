import { useTheme } from 'next-themes'

const GenericModal = ({
    children,
    onClose
}: {
    children: React.ReactNode
    className?: string
    onClose?: () => void
}) => {
    const { theme } = useTheme()
    const isDarkMode = theme === 'dark'
    return (
        <div
            className={`absolute top-0 left-0 w-full h-screen fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${isDarkMode ? 'bg-black/95' : 'bg-white/95'}`}
            onClick={onClose}
        >
            <div onClick={e => e.stopPropagation()} className="max-w-md w-full p-6">
                {children}
            </div>
        </div>
    )
}

export default GenericModal
