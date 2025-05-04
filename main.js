const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Define path to exams directory
// const examsDirectory = path.join(__dirname, 'questions_and_answers'); // Incorrect capitalization
const examsDirectory = path.join(__dirname, "questions and answers"); // Correct capitalization

// Function to get available exam JSON files
async function getExamFiles() {
  try {
    console.log(`Main process: Reading exams from ${examsDirectory}`);
    const files = await fs.promises.readdir(examsDirectory);
    const jsonFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".json"
    );
    console.log(`Main process: Found exam files: ${jsonFiles.join(", ")}`);
    return jsonFiles;
  } catch (error) {
    console.error("Main process: Error reading exams directory:", error);
    return []; // Return empty array on error
  }
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set up IPC handler before creating the window
  ipcMain.handle("get-exam-list", async () => {
    console.log("Main process: Received get-exam-list request.");
    const examList = await getExamFiles();
    return examList;
  });

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Set up IPC handlers
  setupIPCHandlers();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Set up IPC handlers for communication with renderer process
function setupIPCHandlers() {
  // Handler to get list of exam files from the default directory
  ipcMain.handle("getExamList", async () => {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(examsDirectory)) {
        fs.mkdirSync(examsDirectory, { recursive: true });
        return []; // Return empty array if directory was just created
      }

      // Read directory and filter for JSON files
      const files = fs.readdirSync(examsDirectory);
      return files.filter((file) => file.endsWith(".json"));
    } catch (error) {
      console.error("Error getting exam list:", error);
      return [];
    }
  });

  // Handler to get question count from a file
  ipcMain.handle("getQuestionCount", async (event, filename) => {
    try {
      let filePath;

      // Check if filename is an absolute path
      if (path.isAbsolute(filename)) {
        filePath = filename;
      } else {
        // Assume filename is in the default directory
        filePath = path.join(examsDirectory, filename);
      }

      if (!fs.existsSync(filePath)) {
        return 0;
      }

      const data = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(data);

      return Array.isArray(jsonData) ? jsonData.length : 0;
    } catch (error) {
      console.error(`Error getting question count for ${filename}:`, error);
      return 0;
    }
  });

  // Handler for opening file dialog
  ipcMain.handle("openFileDialog", async (event, options) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: options.properties || ["openFile"],
        title: options.title || "Select File",
        buttonLabel: options.buttonLabel || "Select",
        filters: options.filters || [{ name: "All Files", extensions: ["*"] }],
      });

      if (result.canceled) {
        return [];
      }

      return result.filePaths;
    } catch (error) {
      console.error("Error opening file dialog:", error);
      throw error;
    }
  });

  // Handler for opening directory dialog
  ipcMain.handle("openDirectoryDialog", async (event, options) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: options.title || "Select Directory",
        buttonLabel: options.buttonLabel || "Select",
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0]; // Return the selected directory path
    } catch (error) {
      console.error("Error opening directory dialog:", error);
      throw error;
    }
  });

  // Handler to get JSON files from a directory
  ipcMain.handle("getJSONFilesFromDirectory", async (event, directoryPath) => {
    try {
      if (!fs.existsSync(directoryPath)) {
        return [];
      }

      // Read directory and filter for JSON files
      const files = fs.readdirSync(directoryPath);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      // Return full paths to the JSON files
      return jsonFiles.map((file) => path.join(directoryPath, file));
    } catch (error) {
      console.error("Error reading directory:", error);
      throw error;
    }
  });

  // Handler to generate and save PDF of the current window
  ipcMain.handle("printToPDF", async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      // Generate PDF from current window content
      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
      });
      // Prompt user to save the PDF
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: "Save Report as PDF",
        defaultPath: "report.pdf",
        filters: [{ name: "PDF Files", extensions: ["pdf"] }],
      });
      if (canceled || !filePath) {
        return { success: false };
      }
      // Write the PDF file
      await fs.promises.writeFile(filePath, pdfData);
      return { success: true, filePath };
    } catch (error) {
      console.error("Error generating PDF:", error);
      return { success: false };
    }
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
