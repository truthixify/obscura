export const feltToString = (input: bigint | undefined): string => {
    return (
        input
            ?.toString(16)
            .match(/.{2}/g)
            ?.map((c: string) => String.fromCharCode(parseInt(c, 16)))
            .join('') || ''
    )
}
