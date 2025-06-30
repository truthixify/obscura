export async function downloadPrivateKeyFile(filename: string, content: string): Promise<void> {
    try {
        const fileNameWithExt = `${filename}.txt`

        // Use File System Access API if available
        if ('showSaveFilePicker' in window) {
            const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: fileNameWithExt,
                types: [
                    {
                        description: 'Text File',
                        accept: { 'text/plain': ['.txt'] }
                    }
                ]
            })

            const writable = await fileHandle.createWritable()
            await writable.write(content)
            await writable.close()
        } else {
            // Fallback for unsupported browsers
            const blob = new Blob([content], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = fileNameWithExt
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()

            // Wait a moment to ensure the click is processed
            await new Promise(resolve => setTimeout(resolve, 1000))

            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
    } catch (err) {
        console.error('Failed to save file:', err)
        throw err
    }
}
