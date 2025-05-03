const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Define path to exams directory
// const examsDirectory = path.join(__dirname, 'questions_and_answers'); // Incorrect capitalization
const examsDirectory = path.join(__dirname, 'questions and answers'); // Correct capitalization

// Function to get available exam JSON files
async function getExamFiles() {
    try {
        console.log(`Main process: Reading exams from ${examsDirectory}`);
        const files = await fs.readdir(examsDirectory);
        const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
        console.log(`Main process: Found exam files: ${jsonFiles.join(', ')}`);
        return jsonFiles;
    } catch (error) {
        console.error('Main process: Error reading exams directory:', error);
        return []; // Return empty array on error
    }
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000, // Start with a reasonable width
    height: 800, // Start with a reasonable height
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Optional: Use if you need preload script
      nodeIntegration: false, // Recommended for security
      contextIsolation: true, // Recommended for security
      // Allow loading local file resources (like your JSON files)
      webSecurity: false // NOTE: Be careful with this in production
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools (optional, useful for debugging).
   mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set up IPC handler before creating the window
  ipcMain.handle('get-exam-list', async () => {
    console.log('Main process: Received get-exam-list request.');
    const examList = await getExamFiles();
    return examList;
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
