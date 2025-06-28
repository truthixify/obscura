// src/context/DictionaryContext.tsx
import { createContext, useContext } from 'react'
import { WordDictionary } from '../lib/dict'

// Define the context type
interface DictionaryContextType {
    dictionary: WordDictionary
}

// Create the context with a default value
const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined)

// Custom hook to access the dictionary
export const useDictionary = () => {
    const context = useContext(DictionaryContext)
    if (!context) {
        throw new Error('useDictionary must be used within a DictionaryProvider')
    }
    return context.dictionary
}

// Provider component
export const DictionaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize the dictionary (will be loaded in App.tsx)
    const dictionary = new WordDictionary()

    return (
        <DictionaryContext.Provider value={{ dictionary }}>{children}</DictionaryContext.Provider>
    )
}
