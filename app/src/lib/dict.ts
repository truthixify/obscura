export class WordDictionary {
    private words: Set<string> = new Set()
    private isLoaded: boolean = false

    constructor(private fileUrl: string = '/words.txt') {}

    /** Load words from a .txt file (only needs to run once) */
    async load(): Promise<void> {
        if (this.isLoaded) return
        const response = await fetch(this.fileUrl)
        const text = await response.text()

        const lines = text
            .split('\n')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length === 4 && /^[a-z]+$/.test(w))

        this.words = new Set(lines)
        this.isLoaded = true
    }

    /** Get all words */
    getAllWords(): string[] {
        return Array.from(this.words)
    }

    /** Get a random word */
    getRandomWord(): string {
        const wordArray = this.getAllWords()
        const index = Math.floor(Math.random() * wordArray.length)
        return wordArray[index]
    }

    /** Check if a word exists */
    hasWord(word: string): boolean {
        return this.words.has(word.toLowerCase())
    }

    /** Search words containing a substring */
    searchWords(query: string): string[] {
        const q = query.toLowerCase()
        return this.getAllWords().filter(w => w.includes(q))
    }

    /** Search words that start with a prefix */
    startsWith(prefix: string): string[] {
        const p = prefix.toLowerCase()
        return this.getAllWords().filter(w => w.startsWith(p))
    }

    /** Search words that end with a suffix */
    endsWith(suffix: string): string[] {
        const s = suffix.toLowerCase()
        return this.getAllWords().filter(w => w.endsWith(s))
    }
}
