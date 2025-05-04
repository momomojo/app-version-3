// preload.js

const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script executing...");

contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Fetches the list of available exam filenames from the main process.
   * @returns {Promise<string[]>} A promise that resolves with an array of filenames.
   */
  getExamList: async () => {
    console.log("Preload: Invoking getExamList");
    try {
      const examList = await ipcRenderer.invoke("getExamList");
      console.log("Preload: Received exam list:", examList);
      return examList;
    } catch (error) {
      console.error("Preload: Error invoking getExamList:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Gets the question count from a specific exam file.
   * @param {string} filename - The filename to count questions from.
   * @returns {Promise<number>} A promise that resolves with the question count.
   */
  getQuestionCount: async (filename) => {
    try {
      return await ipcRenderer.invoke("getQuestionCount", filename);
    } catch (error) {
      console.error(
        `Preload: Error getting question count for ${filename}:`,
        error
      );
      return 0;
    }
  },

  /**
   * Opens a file dialog to select one or more files.
   * @param {Object} options - Dialog options.
   * @returns {Promise<string[]>} A promise that resolves with an array of selected file paths.
   */
  openFileDialog: async (options) => {
    try {
      return await ipcRenderer.invoke("openFileDialog", options);
    } catch (error) {
      console.error("Preload: Error opening file dialog:", error);
      throw error;
    }
  },

  /**
   * Opens a directory dialog to select a directory.
   * @param {Object} options - Dialog options.
   * @returns {Promise<string|null>} A promise that resolves with the selected directory path.
   */
  openDirectoryDialog: async (options) => {
    try {
      return await ipcRenderer.invoke("openDirectoryDialog", options);
    } catch (error) {
      console.error("Preload: Error opening directory dialog:", error);
      throw error;
    }
  },

  /**
   * Generates a PDF of the current window and saves it via a save dialog.
   * @returns {Promise<{success: boolean, filePath?: string}>}
   */
  printToPDF: async () => {
    try {
      return await ipcRenderer.invoke("printToPDF");
    } catch (error) {
      console.error("Preload: Error invoking printToPDF:", error);
      return { success: false };
    }
  },

  /**
   * Gets all JSON files from a specific directory.
   * @param {string} directoryPath - The directory to scan for JSON files.
   * @returns {Promise<string[]>} A promise that resolves with an array of file paths.
   */
  getJSONFilesFromDirectory: async (directoryPath) => {
    try {
      return await ipcRenderer.invoke(
        "getJSONFilesFromDirectory",
        directoryPath
      );
    } catch (error) {
      console.error("Preload: Error getting JSON files from directory:", error);
      throw error;
    }
  },
});

console.log("Preload script finished.");
