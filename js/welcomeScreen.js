import { initializeExam } from './renderer.js';
import { showView } from './uiController.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('WelcomeScreen: DOMContentLoaded');

    const welcomeScreenDiv = document.getElementById('welcome-screen');
    const appContainerDiv = document.getElementById('app-container');
    const examSelect = document.getElementById('exam-select');
    const startExamBtn = document.getElementById('start-exam-btn');
    const loadingMessage = document.getElementById('loading-message');

    if (!welcomeScreenDiv || !appContainerDiv || !examSelect || !startExamBtn || !loadingMessage) {
        console.error('WelcomeScreen: Required HTML elements not found!');
        return;
    }

    // --- Functions ---
    async function populateExamList() {
        console.log('WelcomeScreen: Populating exam list...');
        loadingMessage.textContent = 'Loading available exams...';
        startExamBtn.disabled = true;

        try {
            // Check if electronAPI is exposed
            if (!window.electronAPI || typeof window.electronAPI.getExamList !== 'function') {
                throw new Error('electronAPI or getExamList function is not available. Is preload.js correctly configured?');
            }

            const examFiles = await window.electronAPI.getExamList();
            console.log('WelcomeScreen: Received exam files:', examFiles);

            examSelect.innerHTML = '<option value="">--Please choose an exam--</option>'; // Clear existing options

            if (examFiles.length === 0) {
                loadingMessage.textContent = 'No exam files found in questions_and_answers directory.';
                console.warn('WelcomeScreen: No exam files returned from main process.');
            } else {
                examFiles.forEach(filename => {
                    const option = document.createElement('option');
                    option.value = filename;
                    option.textContent = filename.replace('.json', ''); // Display cleaner name
                    examSelect.appendChild(option);
                });
                loadingMessage.textContent = ''; // Clear loading message
            }
        } catch (error) {
            console.error('WelcomeScreen: Error fetching or populating exam list:', error);
            loadingMessage.textContent = `Error loading exams: ${error.message}`; 
            examSelect.innerHTML = '<option value="">--Error loading exams--</option>';
        }
    }

    // --- Event Listeners ---
    examSelect.addEventListener('change', () => {
        // Enable start button only if a valid exam is selected
        startExamBtn.disabled = !examSelect.value;
    });

    startExamBtn.addEventListener('click', () => {
        const selectedFilename = examSelect.value;
        if (!selectedFilename) {
            alert('Please select an exam first.');
            return;
        }

        console.log(`WelcomeScreen: Starting exam with ${selectedFilename}`);

        // Hide welcome screen and show main app
        // Use UIController to switch views
        showView('exam');

        // Call the initialization function in renderer.js (make sure renderer.js is loaded)
        initializeExam(selectedFilename);
    });

    // --- Initialization ---
    populateExamList();

});

console.log('welcomeScreen.js loaded');
