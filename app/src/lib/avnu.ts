import axios from 'axios'

export async function checkGaslessStatus() {
    const response = await axios.get('https://starknet.api.avnu.fi/paymaster/v1/status')
    console.log('Gasless Service Status:', response.data)
}

export async function buildTypedData(userAddress, calls) {
    const response = await axios.post(
        'https://starknet.api.avnu.fi/paymaster/v1/build-typed-data',
        {
            userAddress,
            gasTokenAddress: null, // Sponsored gas
            maxGasTokenAmount: null, // Sponsored gas
            calls
        },
        {
            headers: { 'api-key': process.env.PAYMASTER_API_KEY }
        }
    )
    console.log('Typed Data:', response.data)
}

export async function executeSponsoredTransaction(userAddress, typedData, signature) {
    const response = await axios.post(
        'https://starknet.api.avnu.fi/paymaster/v1/execute',
        {
            userAddress,
            typedData,
            signature
        },
        {
            headers: { 'api-key': process.env.PAYMASTER_API_KEY }
        }
    )
    console.log('Sponsored Transaction Hash:', response.data.transactionHash)
}
