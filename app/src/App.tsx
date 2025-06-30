// @ts-nocheck
import { useState, useEffect } from 'react'
import vkUrl from './assets/vk.bin?url'
import initNoirC from '@noir-lang/noirc_abi'
import initACVM from '@noir-lang/acvm_js'
import acvm from '@noir-lang/acvm_js/web/acvm_js_bg.wasm?url'
import noirc from '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url'
import { useScaffoldReadContract } from './hooks/scaffold-stark/useScaffoldReadContract'
import { useAccount } from './hooks/useAccount'
import Obscura from './components/obscura/index'
import { feltToString } from './utils/utils'
import { toast } from './hooks/use-toast'
import { init as initGaraga } from 'garaga'

function App() {
    const [vk, setVk] = useState<Uint8Array | null>(null)
    const { address } = useAccount()

    // Initialize WASM on component mount
    useEffect(() => {
        const initWasm = async () => {
            try {
                if (typeof window !== 'undefined') {
                    await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))])
                    console.log('WASM initialization in App complete')
                }
            } catch (error) {
                toast({
                    title: 'Load WASM error',
                    description: "'Failed to initialize WASM in App",
                    variant: 'destructive'
                })
                console.error('Failed to initialize WASM in App component:', error)
            }
        }

        const loadVk = async () => {
            const response = await fetch(vkUrl)
            const arrayBuffer = await response.arrayBuffer()
            const binaryData = new Uint8Array(arrayBuffer)
            setVk(binaryData)
            console.log('Loaded verifying key:', binaryData)
        }

        initGaraga()
        initWasm()
        // loadVk()
    }, [])

    return <Obscura />
}

export default App
