const knownErrors = [
    'Contract not found',
    'You need to register first before you can start a game',
    'You need to register first before you can join a game',
    'You cannot join your own game',
    'Opponent already joined',
    'Not in CommitSolutionHash stage',
    'User already registered',
    'Not in Playing stage',
    'Guess length must be 4',
    'Max round reached',
    'Solution hash is not correct',
    'Blow is not 0',
    'Not in Reveal stage',
    'Solution length must be 4',
    'Invalid solution',
    "Proof is invalid'",
    'Invalid transaction nonce'
]

export function extractKnownErrorMessage(
    rawError: any,
    expectedMessages: string[] = knownErrors
): string | null {
    try {
        const errorStr = typeof rawError === 'string' ? rawError : JSON.stringify(rawError)

        for (const message of expectedMessages) {
            if (errorStr.includes(message)) {
                return message
            }
        }

        // If we can't match directly, try to parse and look inside nested `.error.error...`
        const jsonMatches = errorStr.match(/{.*}/s)
        if (!jsonMatches) return null

        let current = JSON.parse(jsonMatches[0])
        while (current?.error) {
            if (typeof current.error === 'string') {
                for (const message of expectedMessages) {
                    if (current.error.includes(message)) {
                        return message
                    }
                }
                break
            }
            current = current.error
        }
    } catch {
        return null
    }

    return null
}
