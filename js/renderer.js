// --- Renderer Process Logic ---

// --- Imports ---
import { loadQuestions } from './examManager.js';
import {
    renderQuestionUI,
    updateNavigationButtons,
    showView,
    enableControls,
    disableControls,
    setUiControllerReferences,
    applySavedTheme, // Needed if theme logic affects renderer directly?
    openReviewModal, // Needed for button listener
    showHelp,        // Needed for button listener
    openCalculator   // Needed for button listener
} from './uiController.js';
import { generateReport } from './reportGenerator.js'; // Import generateReport

// --- State Variables ---
let questions = [];

// --- State Variables ---
let currentQuestionIndex = 0;
let userAnswers = []; // Will be initialized after questions are loaded
let markedQuestions = []; // Will be initialized after questions are loaded
let crossedOutOptions = []; // Will be initialized after questions are loaded
let userAnnotations = []; // Stores { questionIndex: { strikethroughs: ['A', 'B', ...] } }

// --- DOM Elements ---
const examContainer = document.querySelector('.app-container');
const reportContainer = document.getElementById('report-container');
const questionArea = document.getElementById('question-area');
const restartButton = document.getElementById('restart-button');

// Help Modal elements moved to uiController.js
// const helpModal = document.getElementById('help-modal');

// --- Functions ---

// --- Core Rendering & UI Update --- 

function renderQuestion(index) {
    console.log(`Renderer: Rendering question index ${index}`);
    if (index < 0 || index >= questions.length) {
        console.error(`Invalid question index: ${index}`);
        return;
    }

    const question = questions[index];
    const userAnswer = userAnswers[index]; // Get user's answer for this question
    const isMarked = markedQuestions[index]; // Get marked status

    // Call the UI controller function to handle DOM updates
    if (typeof renderQuestionUI === 'function') {
         renderQuestionUI(question, index, questions.length, userAnswer, isMarked);
    } else {
         console.error("renderQuestionUI function not found in uiController.js!");
         // Basic fallback (consider displaying error in UI)
         const qTextDiv = document.getElementById('question-text'); 
         if(qTextDiv) qTextDiv.textContent = "Error: UI rendering function unavailable.";
    }
    
    // Call UI controller to update navigation buttons
    if (typeof updateNavigationButtons === 'function') {
        updateNavigationButtons(index, questions.length);
    } else {
        console.error("updateNavigationButtons function not found in uiController.js!");
    }
}

function nextQuestion() {
    handleNavigationClick('next');
}

function previousQuestion() {
    handleNavigationClick('prev');
}

function handleMarkCheckboxChange() {
    markedQuestions[currentQuestionIndex] = markCheckbox.checked;
    // Optional: provide visual feedback elsewhere (e.g., in a review list)
}

// Handles storing the user's selected answer
function handleAnswerSelection(selectedValue) {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < userAnswers.length) {
        console.log(`Storing answer for question ${currentQuestionIndex}: ${selectedValue}`);
        userAnswers[currentQuestionIndex] = selectedValue;
    } else {
        console.error(`Invalid currentQuestionIndex (${currentQuestionIndex}) for storing answer.`);
    }
}

function handleOptionClick(event) {
    const clickedOption = event.currentTarget;
    const questionIndex = parseInt(clickedOption.dataset.questionIndex);
    const optionLetter = clickedOption.dataset.option;

    // If this option is already crossed out, do nothing on click
    if (crossedOutOptions[questionIndex].has(optionLetter)) {
        return;
    }

    // Deselect previous selection for this question
    questionArea.querySelectorAll('.option').forEach(opt => {
        // Only deselect options for the current question
        if (parseInt(opt.dataset.questionIndex) === questionIndex) {
            opt.classList.remove('selected');
            opt.querySelector('input[type="radio"]').checked = false;
        }
    });

    // Select the clicked option
    clickedOption.classList.add('selected');
    clickedOption.querySelector('input[type="radio"]').checked = true;
    userAnswers[questionIndex] = optionLetter;
}

function handleOptionRightClick(event) {
    event.preventDefault(); // Prevent default context menu

    const clickedOption = event.currentTarget;
    const questionIndex = parseInt(clickedOption.dataset.questionIndex);
    const optionLetter = clickedOption.dataset.option;

    const isCurrentlySelected = clickedOption.classList.contains('selected');

    // If the option is currently selected, deselect it before crossing out
    if (isCurrentlySelected) {
        clickedOption.classList.remove('selected');
        clickedOption.querySelector('input[type="radio"]').checked = false;
        userAnswers[questionIndex] = null; // Clear the user's selection
    }

    // Toggle the crossed-out state
    clickedOption.classList.toggle('crossed-out');

    if (clickedOption.classList.contains('crossed-out')) {
        crossedOutOptions[questionIndex].add(optionLetter);
    } else {
        crossedOutOptions[questionIndex].delete(optionLetter);
    }
}

function handleNavigationClick(direction) {
    if (direction === 'next') {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
        } else {
             // End of test, show report
            endExam();
            return; // Don't render next question
        }
    } else if (direction === 'prev') {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
        }
    }
    renderQuestion(currentQuestionIndex);
     // Scroll to the top of the question area on navigation
    questionArea.scrollTo(0, 0);
}

function handleHighlightSelection(event) { // Changed from no arg to event
    console.log("handleHighlightSelection called"); // <-- Add Entry Log
    // Use event.currentTarget which IS the .question-text element the listener was attached to
    const questionTextElement = event.currentTarget;

    // The check below is no longer strictly needed as the listener IS on the element,
    // but we keep it as a safeguard in case the event bubbles unexpectedly.
     if (!event.target.closest('.question-text')) { // Check if the actual click target is inside
         console.log("Highlight aborted: Target not within .question-text"); // <-- Add Log
         return; // Exit if the click wasn't truly inside the text area
     }


    const selection = window.getSelection();
    // Exit if no selection or selection is empty (collapsed)
    if (!selection.rangeCount || selection.isCollapsed) { 
        console.log("Highlight aborted: No selection range or selection collapsed"); // <-- Add Log
        return; 
    }

    const range = selection.getRangeAt(0);

     // Prevent highlighting if selection is zero width (e.g., just a click)
    if (range.getBoundingClientRect().width === 0) {
        console.log("Highlight aborted: Zero-width selection"); // <-- Add Log
        selection.removeAllRanges(); // Clear the collapsed selection
        return;
    } 
    
    // *** Add null check for the common ancestor container ***
    if (!range.commonAncestorContainer) { 
        console.warn("Highlight aborted: Selection common ancestor is null."); // <-- Modified Log
        selection.removeAllRanges(); 
        return;
    }

    // *** Add check if it's a valid Node ***
    if (!(range.commonAncestorContainer instanceof Node)) {
         console.warn("Highlight aborted: Selection common ancestor is not a valid Node:", range.commonAncestorContainer); // <-- Modified Log
         selection.removeAllRanges();
         return;
    }

    // Check if the valid common ancestor Node is within the target element (event.currentTarget)
    let isContained = false;
    try {
        // --- Wrap this check in try...catch ---
        isContained = questionTextElement.contains(range.commonAncestorContainer);
    } catch (error) {
        console.error("Error during .contains() check:", error); // Keep error logs
        console.error("questionTextElement:", questionTextElement);
        console.error("commonAncestorContainer:", range.commonAncestorContainer);
        selection.removeAllRanges(); // Attempt to clear selection on error
        console.log("Highlight aborted: Error during contains() check."); // <-- Add Log
        return; // Exit if check fails
    }

    if (!isContained) {
        console.log("Highlight aborted: Selection not contained within question text."); // <-- Add Log
         selection.removeAllRanges(); // Clear selection if outside target area
        return;
    }
    
    // If all checks pass, apply the highlight
    console.log("Applying highlight..."); // <-- Add Log
    applyHighlight(range);
     // Selection is cleared within applyHighlight AFTER insertion
}

function applyHighlight(range) {
    // Create a span to wrap the selection
    const highlightSpan = document.createElement('span');
    highlightSpan.className = 'highlighted-text';
    
    // Add click listener to the span itself for removal
    highlightSpan.addEventListener('click', () => {
         removeHighlight(highlightSpan);
    });

    try {
        // This might throw an error if the selection spans across
        // elements that cannot contain a span, or crosses boundaries
        // in complex ways. A more robust solution might involve iterating
        // through nodes in the range.
        range.surroundContents(highlightSpan);
        window.getSelection().removeAllRanges(); // Clear selection after highlighting
    } catch (e) {
        console.error("Highlighting error: ", e);
        // Optional: Provide feedback if highlighting fails
        // alert("Could not highlight the selection. It might span across incompatible elements.");
        // Attempt to clear selection even on error
        window.getSelection().removeAllRanges();
    }
}

function removeHighlight(spanElement) {
     const parent = spanElement.parentNode;
     if (!parent) return;

     // Move all child nodes of the span out before the span
     while (spanElement.firstChild) {
          parent.insertBefore(spanElement.firstChild, spanElement);
     }
     // Remove the now-empty span
     parent.removeChild(spanElement);
     parent.normalize(); // Merges adjacent text nodes (optional but good practice)
}

// --- Exam Flow Control ---
function endExam() {
    console.log("Ending exam...");
    stopTimer(); 
    const scoreData = calculateScore(); // Calculate and get score data

    // Use UI Controller to handle view switching
    if (typeof showReportArea === 'function') {
        showReportArea();
    } else {
        console.error("showReportArea function not found in uiController.js");
        // Fallback or error handling if function doesn't exist
        if (examContainer) examContainer.classList.add('hidden'); 
        if (reportContainer) reportContainer.classList.remove('hidden'); 
    }

    // Get the report element locally
    const reportContentDiv = document.getElementById('report-content'); 
    if (reportContentDiv && typeof generateReport === 'function') {
        generateReport(reportContentDiv, questions, userAnswers, scoreData); // Call from reportGenerator.js
    } else if (!reportContentDiv){
        console.error("Report content div not found!");
    } else {
        console.error("generateReport function not found in reportGenerator.js!");
    }

    // Disable navigation buttons, etc. (Handled by showReportArea now)
    // disableControls(); 
}

// Resets the exam state and starts over
function restartExam() {
    console.log("Restarting exam...");
    // Reset state variables
    currentQuestionIndex = 0;
    userAnswers = new Array(questions.length).fill(null);
    markedQuestions = new Array(questions.length).fill(false);
    crossedOutOptions = questions.map(() => new Set());
    userAnnotations = questions.map(() => ({ strikethroughs: [], notes: '' })); // Adjusted structure slightly

    // *** Call setUiControllerReferences again after reset ***
    if (typeof setUiControllerReferences === 'function') {
        setUiControllerReferences(questions, userAnswers, markedQuestions);
    } else {
        // console.warn("setUiControllerReferences function not found in uiController.js yet");
    }

    // Reset UI elements managed by renderer
    // renderQuestion(currentQuestionIndex); // Moved to after enableControls call
    // Render first question
    renderQuestion(currentQuestionIndex);

    // Use UI Controller to switch back to the exam view
    if (typeof showExamArea === 'function') {
        showExamArea();
    } else {
        console.error("showExamArea function not found in uiController.js");
        // Fallback or error handling
        if (reportContainer) reportContainer.classList.add('hidden');
        if (examContainer) examContainer.classList.remove('hidden');
    }

    // Restart timer and render first question (keep this logic here)
    setupExamControlListeners(); // Re-enable controls
    // Enable controls (Handled by showExamArea now)
    // enableControls(); 
}

// --- Initialization and Listeners --- 

// Placeholder for loading state logic
function showLoadingState(message) {
    console.log(`Loading: ${message}`);
    // TODO: Implement UI changes for loading (e.g., show spinner)
}

function hideLoadingState() {
    console.log("Loading complete.");
    // TODO: Hide spinner
}

// --- Initialization --- 
export async function initializeExam(examFilename = 'Neuro-E-5.json') {
    console.log(`Renderer: Initializing exam with ${examFilename}...`);
    showLoadingState(`Loading ${examFilename}...`);
    if (typeof disableControls === 'function') {
        disableControls(); // Disable controls during load
    } else {
        console.error("Global disableControls function not found!");
    }

    try {
        // Load questions using ExamManager
        questions = await loadQuestions(examFilename);

        // Initialize state based on loaded questions
        currentQuestionIndex = 0;
        userAnswers = new Array(questions.length).fill(null);
        markedQuestions = new Array(questions.length).fill(false);
        crossedOutOptions = questions.map(() => new Set());
        userAnnotations = questions.map(() => ({ highlights: [], notes: '' })); // Adjusted structure slightly

        // --- Start Timer ---
        const totalDurationSeconds = questions.length * 90; // 90 seconds per question
        if (typeof startTimer === 'function') {
            console.log(`Renderer: Starting timer with duration: ${totalDurationSeconds} seconds.`);
            startTimer(totalDurationSeconds);
        } else {
            console.error("startTimer function not found in timer.js! Cannot start timer.");
        }

        // Initial UI setup
        renderQuestion(currentQuestionIndex); 
        if (typeof enableControls === 'function') {
             enableControls(); // Enable controls only after questions are loaded
        } else {
             console.error("Global enableControls function not found!");
        }
        // Setup listeners that might depend on exam content being present
        setupExamControlListeners(); 
        setupReviewModalListeners(); 

    } catch (error) {
        console.error("Initialization failed:", error);
        // Display a user-friendly error message in the exam area
        const examAreaDiv = document.getElementById('exam-area'); 
        if(examAreaDiv) examAreaDiv.innerHTML = `<p style="color: red; padding: 20px;">Error initializing exam: ${error.message}. Please check the console or try selecting a different exam.</p>`;
        
        // Optionally disable controls via UI controller on error
        if (typeof disableControls === 'function') {
             disableControls(); 
        } else {
            console.error("Global disableControls function not found!");
        }
        // Ensure essential controls like dark mode toggle remain functional if needed
    }

    // Re-enable controls after setup
    if (typeof enableControls === 'function') {
        enableControls();
    } else {
        console.error("Global enableControls function not found!");
    }

    hideLoadingState();
    console.log("Initialization complete.");
}

function setupExamControlListeners() {
    console.log("Setting up exam control listeners...");
    // Get button references (ensure they exist after start)
    const labValuesButton = document.getElementById('lab-values-button');
    const calculatorButton = document.getElementById('calculator-button');
    const reviewButton = document.getElementById('review-button'); // Added review button reference
    const pauseButton = document.getElementById('pause-button'); // Added pause button reference
    const helpButton = document.getElementById('help-button');
    const restartButton = document.getElementById('restart-button'); // Assuming restart button exists on report
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');

    // Question Header Controls
    const markCheckbox = document.getElementById('mark-question');
    if (markCheckbox) {
        markCheckbox.addEventListener('change', handleMarkCheckboxChange);
    } else {
        console.error("Mark question checkbox not found!");
    }

    const optionsList = document.getElementById('options-list'); // Get options list container
    if (optionsList) {
        optionsList.addEventListener('change', (event) => {
            // Check if the event target is a radio button within the list
            if (event.target.type === 'radio' && event.target.name === 'option') {
                const selectedValue = event.target.value;
                handleAnswerSelection(selectedValue); // Call handler from renderer.js
            }
        });
    } else {
        console.error("Options list container (#options-list) not found!");
    }

    // Navigation listeners
    if (nextButton) {
        nextButton.addEventListener('click', nextQuestion); // Assuming nextQuestion handles submit logic
    } else {
        console.error("Next button not found!");
    }
    if (prevButton) {
        prevButton.addEventListener('click', previousQuestion);
    } else {
        console.error("Previous button not found!");
    }

    // Utility button listeners
    if (labValuesButton) {
        labValuesButton.addEventListener('click', () => {
            // Call the function now defined in labValues.js (assuming global scope)
            if (typeof openLabValuesPanel === 'function') { 
                openLabValuesPanel();
            } else {
                console.error("openLabValuesPanel function not found! Ensure labValues.js is loaded.");
            }
        });
    } else {
        console.error("Lab values button not found!");
    }
    // Calculator button listener
    if (calculatorButton) {
        calculatorButton.addEventListener('click', () => {
            // Call the function now defined in uiController
            if (typeof openCalculator === 'function') {
                 openCalculator();
             } else {
                console.error("openCalculator function not found in uiController.js");
            }
        });
    } else {
         console.error("Calculator button not found!");
    }
    // Help button listener
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            // Call the function now defined in uiController
            if (typeof showHelp === 'function') {
                showHelp();
            } else {
                 console.error("showHelp function not found in uiController.js");
             }
        });
    } else {
        console.error("Help button not found!");
    }
    // Review button listener
    if (reviewButton) {
        reviewButton.addEventListener('click', () => {
             if (typeof openReviewModal === 'function') {
                 openReviewModal(); // Call function from uiController
             } else {
                 console.error("openReviewModal function not found in uiController.js");
             }
         });
    } else {
        console.error("Review button not found!");
    }
    // Pause button listener
    if (pauseButton) {
         pauseButton.addEventListener('click', () => {
             if (typeof togglePause === 'function') {
                 togglePause(); // Call function from timer.js
             } else {
                 console.error("togglePause function not found in timer.js");
             }
         });
    } else {
        console.error("Pause button not found!");
    }
    // Restart button listener
    if (restartButton) restartButton.addEventListener('click', restartExam);
     console.log("Exam control listeners attached.");
}

function setupReviewModalListeners() {
    // Listeners for controls *inside* the modal (close, filters, list clicks) 
    // are now handled within uiController.js (specifically in openReviewModal/closeReviewModal)
    // We only need to ensure the main 'Review Exam' button listener is attached (done in setupExamControlListeners)
    console.log("Review modal listeners setup (now handled by uiController.js when opened).");
}

// --- Event Listener for Navigation from Review Modal ---
document.addEventListener('navigateToQuestion', (event) => {
    if (event.detail && typeof event.detail.questionIndex === 'number') {
        const index = event.detail.questionIndex;
        console.log(`Renderer: Received navigateToQuestion event for index ${index}`);
        if (index >= 0 && index < questions.length) {
            currentQuestionIndex = index;
            renderQuestion(currentQuestionIndex);
            questionArea.scrollTo(0, 0); // Scroll to top
        } else {
            console.error(`Renderer: Invalid index received from navigateToQuestion event: ${index}`);
        }
    } else {
        console.error("Renderer: Invalid navigateToQuestion event received", event);
    }
});

// --- Event Listener for Start Request --- 
document.addEventListener('startExamRequested', (event) => {
    const examFile = event.detail.examFile;
    console.log("Received startExamRequested event for:", examFile);
    initializeExam(examFile).catch(error => {
        console.error("Error during exam initialization:", error);
        // Optionally show an error message to the user in the UI
        if (questionArea) {
            questionArea.innerHTML = `<p style="color: red; padding: 20px;">Failed to initialize exam. Please check the console and ensure the exam file is valid.</p>`;
        }
        hideLoadingState(); // Ensure loading state is hidden on error
    });
});

// Initial UI setup (e.g., show welcome screen) is handled by uiController.showView('welcome')
// which should be called when the application first loads.
// Ensure uiController's init function or equivalent is called.
console.log("Renderer script loaded.");
