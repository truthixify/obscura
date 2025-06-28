// Generate a random game ID
export function generateGameId(): number {
    return Math.ceil(Math.random() * 100)
}

// Generate a commit hash for the secret word
// In a real implementation, this would use a cryptographic hash function
export function generateCommitHash(word: string): string {
    // This is a simplified version for demonstration purposes
    const timestamp = Date.now().toString()
    const randomSalt = Math.random().toString(36).substring(2, 15)

    // Combine word, timestamp, and salt
    const combined = `${word}-${timestamp}-${randomSalt}`

    // Create a simple hash (not secure, just for demo)
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
    }

    // Convert to hex string and add some random characters
    return `${hash.toString(16).padStart(8, '0')}-${randomSalt}-${timestamp.substring(timestamp.length - 4)}`
}
