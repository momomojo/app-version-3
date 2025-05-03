// preload.js

const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executing...');

contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Fetches the list of available exam filenames from the main process.
     * @returns {Promise<string[]>} A promise that resolves with an array of filenames.
     */
    getExamList: async () => {
        console.log('Preload: Invoking get-exam-list');
        try {
            const examList = await ipcRenderer.invoke('get-exam-list');
            console.log('Preload: Received exam list:', examList);
            return examList;
        } catch (error) {
            console.error('Preload: Error invoking get-exam-list:', error);
            return []; // Return empty array on error
        }
    }
});

console.log('Preload script finished.');
