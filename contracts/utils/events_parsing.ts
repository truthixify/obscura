import { ByteArray, byteArray, Contract, RpcProvider, events, CallData, num, hash } from 'starknet'

export const parseEvents = async (
    obscura: Contract,
    provider: RpcProvider,
    eventName: string,
    otherKeys: any[] = [],
    from_block?: any,
    to_block?: any
): Promise<any[]> => {
    const keyFilter = [[num.toHex(hash.starknetKeccak(eventName)), ...otherKeys]]
    const eventsList = await provider.getEvents({
        address: obscura.address,
        keys: keyFilter,
        from_block,
        to_block,
        chunk_size: 10
    })
    const abiEvents = events.getAbiEvents(obscura.abi)
    const abiStructs = CallData.getAbiStruct(obscura.abi)
    const abiEnums = CallData.getAbiEnum(obscura.abi)
    const parsedEvents = events.parseEvents(eventsList.events, abiEvents, abiStructs, abiEnums)

    return parsedEvents
}

export const parseByteArray = (emittedData: string[]): string => {
    const length = emittedData.length
    const byteArrayData = emittedData.slice(1, length - 2)
    const byteArrayPendingWord = emittedData[length - 2]
    const byteArrayPendingWordLen = emittedData[length - 1]
    const emittedByteArray: ByteArray = {
        data: byteArrayData,
        pending_word: byteArrayPendingWord,
        pending_word_len: byteArrayPendingWordLen
    }

    return byteArray.stringFromByteArray(emittedByteArray)
}

export const parsePublicKeyEvent = async (
    obscura: Contract,
    provider: RpcProvider,
    otherKeys: any[] = [],
    from_block?: any,
    to_block?: any
): Promise<any[]> => {
    const parsedEvents = await parseEvents(
        obscura,
        provider,
        'PublicKey',
        otherKeys,
        from_block,
        to_block
    )

    return parsedEvents
        .sort((a, b) => a.block_number - b.block_number)
        .map(event => event['obscura::events::PublicKey'])
}

export const parseNewCommitEvent = async (
    obscura: Contract,
    provider: RpcProvider,
    from_block?: any,
    to_block?: any
): Promise<any[]> => {
    const parsedEvents = await parseEvents(
        obscura,
        provider,
        'NewCommitment',
        [],
        from_block,
        to_block
    )

    return parsedEvents
        .sort(
            (a: any, b: any) =>
                Number(a['obscura::events::NewCommitment'].index) -
                Number(b['obscura::events::NewCommitment'].index)
        )
        .map(event => event['obscura::events::NewCommitment'])
}
