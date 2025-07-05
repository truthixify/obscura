import axios from 'axios'
import { Call } from 'starknet'

const api = axios.create({
    baseURL: 'https://obscura-api.onrender.com/api/',
    headers: {
        'Content-Type': 'application/json'
    }
})

/**
 * Interface for account data used in POST and response
 */
export interface AccountData {
    blockNumber?: number
    owner: string
    address: string
    _id?: string
    createdAt?: string
    updatedAt?: string
}

/**
 * Interface for query parameters when fetching accounts
 */
export interface AccountQuery {
    owner?: string
    address?: string
}

/**
 * Create a new account entry
 * @param data - The account data to save
 * @returns The created account from the server
 */
export async function createAccount(data: AccountData): Promise<AccountData> {
    try {
        const res = await api.post<AccountData>('/account', data)
        return res.data
    } catch (err: any) {
        throw err.response?.data || new Error('Failed to create account')
    }
}

/**
 * Get accounts by optional owner or address
 * @param query - Object with optional `owner` and/or `address`
 * @returns The matched account(s)
 */
export async function getAccount(query: AccountQuery = {}): Promise<AccountData> {
    try {
        const res = await api.get<AccountData>('/account', {
            params: query
        })
        return res.data
    } catch (err: any) {
        throw err.response?.data || new Error('Failed to fetch account(s)')
    }
}

export async function buildTypedData(userAddress: string, calls: Call[]): Promise<any> {
    try {
        const res = await api.post('/build-typed-data', {
            userAddress,
            calls
        })
        return res.data
    } catch (err: any) {
        throw err.response?.data || new Error('Failed to build typed data')
    }
}

export async function executeSponsoredTransaction(
    userAddress: string,
    typedData: any,
    signature: string[]
): Promise<any> {
    try {
        const res = await api.post('/execute-sponsored', {
            userAddress,
            typedData,
            signature
        })
        return res.data
    } catch (err: any) {
        throw err.response?.data || new Error('Failed to execute sponsored transaction')
    }
}
