import { promises as fs } from 'fs'
import path from 'path'

/**
 * @notice Returns the compiled code of a contract.
 * @dev Reads the contract class JSON files and returns the Sierra and Casm code.
 * @param filename The name of the contract file.
 * @returns An object containing the Sierra and Casm code.
 * @throws If the contract class JSON files are not found.
 */
export async function getCompiledCode(filename: string) {
    const sierraFilePath = path.join(__dirname, `../target/dev/${filename}.contract_class.json`)
    const casmFilePath = path.join(
        __dirname,
        `../target/dev/${filename}.compiled_contract_class.json`
    )

    const code = [sierraFilePath, casmFilePath].map(async filePath => {
        const file = await fs.readFile(filePath)
        return JSON.parse(file.toString('ascii'))
    })

    const [sierraCode, casmCode] = await Promise.all(code)

    return {
        sierraCode,
        casmCode
    }
}
