const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs').promises

function createWindow () {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    win.loadFile('index.html')

    if (process.argv.includes('--debug')) {
        win.webContents.openDevTools()
    }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Handle reading directory contents
ipcMain.handle('read-directory', async (event, dirPath) => {
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true })
        const filesList = await Promise.all(items.map(async (item) => {
            const fullPath = path.join(dirPath, item.name)
            const stats = await fs.stat(fullPath)
            return {
                name: item.name,
                path: fullPath,
                isDirectory: item.isDirectory(),
                size: stats.size,
                modified: stats.mtime
            }
        }))
        return filesList
    } catch (error) {
        return { error: error.message }
    }
})

// Handle opening file dialog
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    })
    return result.filePaths[0]
})