import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  isDarkMode: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('theme') as Theme
    if (stored) return stored
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const isDarkMode = theme === 'dark'

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', theme)
    
    // Apply theme to document
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    // Update CSS custom properties for better theme support
    if (theme === 'dark') {
      root.style.setProperty('--background', '0 0% 0%')
      root.style.setProperty('--foreground', '0 0% 100%')
    } else {
      root.style.setProperty('--background', '0 0% 100%')
      root.style.setProperty('--foreground', '0 0% 0%')
    }
  }, [theme])

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme: handleSetTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}