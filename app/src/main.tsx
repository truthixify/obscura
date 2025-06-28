import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'
import { ScaffoldStarkAppWithProviders } from './components/ScaffoldStarkAppWithProviders.tsx'
import { Toaster } from './components/ui/toaster.tsx'
import { ThemeProvider } from './components/ThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <ScaffoldStarkAppWithProviders>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 retro-bg-pattern flex flex-col">
                    <App />
                </div>
                <Toaster />
            </ScaffoldStarkAppWithProviders>
        </ThemeProvider>
    </StrictMode>
)
