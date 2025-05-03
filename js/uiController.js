// --- UI Controller ---
// Manages UI elements like buttons, modals, dark mode, etc.

// --- DOM Elements ---
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const markCheckbox = document.getElementById('mark-question');
const reviewModal = document.getElementById('review-modal');
const reviewList = document.getElementById('review-list');
const filterRadios = document.querySelectorAll('input[name="review-filter"]');
const closeReviewButton = document.getElementById('close-review-modal');
const mainWrapper = document.querySelector('.main-wrapper'); // For lab panel toggle
const bodyElement = document.body; // Reference to body for dark mode and modal classes
const darkModeToggle = document.getElementById('dark-mode-toggle');
const helpModal = document.getElementById('help-modal');
const closeHelpButton = document.getElementById('close-help-modal');
const calculatorModal = document.getElementById('calculator-modal');
const calculatorDisplay = document.getElementById('calculator-display');
const calculatorButtons = document.getElementById('calculator-buttons');
const closeCalculatorButton = document.getElementById('close-calculator-modal');
// Main Layout Elements
const welcomeScreenDiv = document.getElementById('welcome-screen');
const appContainerDiv = document.getElementById('app-container');
const headerElement = document.querySelector('header');
const footerElement = document.querySelector('footer'); 
// mainWrapper is already defined
const examArea = document.getElementById('question-area'); // Main question display area
const reportArea = document.getElementById('report-container'); // Final report display area
// Question Rendering Elements
const questionNumberSpan = document.getElementById('question-number');
const totalQuestionsSpan = document.getElementById('total-questions');
const examSectionItemSpan = document.getElementById('exam-section-item'); 
const questionTextDiv = document.getElementById('question-text');
const optionsList = document.getElementById('options-list');
const feedbackDiv = document.getElementById('feedback');
const explanationDiv = document.getElementById('explanation');
const highlightedElements = document.querySelectorAll('.highlight'); // For clearing text highlights

// Keep references to elements potentially needed by other modules (or pass them)
// Example: elements needed for populateReviewList if called from elsewhere
let questionsRef = []; // Reference to the questions array from renderer/examManager
let userAnswersRef = []; // Reference to userAnswers array
let markedQuestionsRef = []; // Reference to markedQuestions array

// Function to set references from the module that holds the state (e.g., examManager)
export function setUiControllerReferences(questions, userAnswers, markedQuestions) {
    console.log("UI Controller: Setting state references...");
    questionsRef = questions;
    userAnswersRef = userAnswers;
    markedQuestionsRef = markedQuestions;
}

// --- UI Controls Enable/Disable ---
export function enableControls() {
    console.log("UI Controller: Enabling controls...");
    if (prevButton) prevButton.disabled = false;
    if (nextButton) nextButton.disabled = false;
    if (markCheckbox) markCheckbox.disabled = false;
    if (darkModeToggle) darkModeToggle.disabled = false; // Ensure dark mode toggle is included
    // Utility buttons
    const labButton = document.getElementById('lab-values-button');
    const calcButton = document.getElementById('calculator-button');
    const reviewButton = document.getElementById('review-button');
    const helpButton = document.getElementById('help-button');
    const pauseButton = document.getElementById('pause-button'); // Added pause button
    if (labButton) labButton.disabled = false;
    if (calcButton) calcButton.disabled = false;
    if (reviewButton) reviewButton.disabled = false;
    if (helpButton) helpButton.disabled = false;
    if (pauseButton) pauseButton.disabled = false;
}

export function disableControls() {
    console.log("UI Controller: Disabling controls...");
    if (prevButton) prevButton.disabled = true;
    if (nextButton) nextButton.disabled = true;
    if (markCheckbox) markCheckbox.disabled = true;
    if (darkModeToggle) darkModeToggle.disabled = true;
    // Utility buttons
    const labButton = document.getElementById('lab-values-button');
    const calcButton = document.getElementById('calculator-button');
    const reviewButton = document.getElementById('review-button');
    const helpButton = document.getElementById('help-button');
    const pauseButton = document.getElementById('pause-button'); // Added pause button
    if (labButton) labButton.disabled = true;
    if (calcButton) calcButton.disabled = true;
    if (reviewButton) reviewButton.disabled = true;
    if (helpButton) helpButton.disabled = true;
    if (pauseButton) pauseButton.disabled = true;
}

// --- Dark Mode Functions ---
function enableDarkMode() {
    bodyElement.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.checked = true;
    localStorage.setItem('theme', 'dark');
    console.log("Dark Mode Enabled"); // Console log for verification
}

function disableDarkMode() {
    bodyElement.classList.remove('dark-mode');
    if (darkModeToggle) darkModeToggle.checked = false;
    localStorage.setItem('theme', 'light');
    console.log("Dark Mode Disabled"); // Console log for verification
}

export function toggleDarkMode() {
    if (bodyElement.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

export function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    } else {
        // Default to light mode
        disableDarkMode();
    }
}

// --- Review Modal Logic ---
// Store the event listener function to allow removal
let reviewListClickListener = null;

function handleReviewNavigation(event) {
    if (event.target.tagName === 'SPAN' && event.target.dataset.questionIndex) {
        const index = parseInt(event.target.dataset.questionIndex, 10);
        console.log(`UI Controller: Review navigation clicked for index ${index}`);
        // Dispatch custom event to notify renderer/examManager
        const navigateEvent = new CustomEvent('navigateToQuestion', { 
            detail: { questionIndex: index },
            bubbles: true // Allow event to bubble up if needed
        });
        document.dispatchEvent(navigateEvent);
        console.log("UI Controller: Dispatched navigateToQuestion event.");

        closeReviewModal(); // Close modal after triggering navigation
    }
}

export function openReviewModal() {
    console.log("UI Controller: Opening Review Modal...");
    if (!reviewModal) {
        console.error("Review modal element not found!");
        return;
    }
    populateReviewList(); // Populate with 'all' filter initially
    reviewModal.style.display = 'block';
    bodyElement.classList.add('modal-open'); // Use bodyElement defined earlier

    // Add listeners when modal opens
    if (closeReviewButton) {
        closeReviewButton.addEventListener('click', closeReviewModal);
    }
    filterRadios.forEach(radio => {
        radio.addEventListener('change', () => populateReviewList(radio.value));
    });

    // Remove previous listener before adding a new one to prevent duplicates
    if (reviewList && reviewListClickListener) {
        reviewList.removeEventListener('click', reviewListClickListener);
    }
    reviewListClickListener = handleReviewNavigation; // Store the new listener
    if (reviewList) {
        reviewList.addEventListener('click', reviewListClickListener);
        console.log("UI Controller: Review list click listener attached.");
    } else {
        console.error("Review list element not found for attaching listener!")
    }
}

function closeReviewModal() {
    console.log("UI Controller: Closing Review Modal...");
    if (!reviewModal) return;
    reviewModal.style.display = 'none';
    bodyElement.classList.remove('modal-open'); // Use bodyElement defined earlier

    // Remove listeners when modal closes to prevent memory leaks
    if (closeReviewButton) {
        closeReviewButton.removeEventListener('click', closeReviewModal);
    }
    // It's often okay to leave 'change' listeners on radios unless they cause issues
    // filterRadios.forEach(radio => { radio.removeEventListener('change', ...); }); 

    // Remove the specific click listener from the list
    if (reviewList && reviewListClickListener) {
        reviewList.removeEventListener('click', reviewListClickListener);
        reviewListClickListener = null; // Clear the stored listener
        console.log("UI Controller: Review list click listener removed.");
    }
}

// Populates the review list based on the selected filter
function populateReviewList(filter = 'all') {
    console.log(`UI Controller: Populating review list with filter: ${filter}`);
    if (!reviewList) {
        console.error("Review list element not found!");
        return;
    }
    if (!questionsRef || !userAnswersRef || !markedQuestionsRef || questionsRef.length === 0) {
         console.error("UI Controller references not set or questions array empty!");
         reviewList.innerHTML = '<li>Error: Exam state not available.</li>';
         return;
    }

    reviewList.innerHTML = ''; // Clear previous list
    const numQuestions = questionsRef.length;
    let filteredIndices = [];

    for (let i = 0; i < numQuestions; i++) {
        let include = false;
        const isAnswered = userAnswersRef[i] !== null && userAnswersRef[i] !== undefined;
        const isMarked = markedQuestionsRef[i] === true;

        switch (filter) {
            case 'answered':
                include = isAnswered;
                break;
            case 'unanswered':
                include = !isAnswered;
                break;
            case 'marked':
                include = isMarked;
                break;
            default: // 'all'
                include = true;
                break;
        }
        if (include) {
            filteredIndices.push(i);
        }
    }

    if (filteredIndices.length === 0) {
        const noItemsMessage = document.createElement('li');
        noItemsMessage.textContent = 'No questions match this filter.';
        noItemsMessage.style.textAlign = 'center';
        noItemsMessage.style.marginTop = '20px';
        reviewList.appendChild(noItemsMessage);
        return;
    }

    filteredIndices.forEach(index => {
        const listItem = document.createElement('li');
        listItem.style.marginBottom = '5px'; // Add some spacing

        const questionLink = document.createElement('span');
        questionLink.textContent = `Question ${index + 1}`;
        questionLink.dataset.questionIndex = index; // Store index for navigation
        questionLink.style.cursor = 'pointer';
        questionLink.style.textDecoration = 'underline';
        questionLink.style.color = 'var(--link-color, blue)'; // Use CSS variable or default
        questionLink.setAttribute('role', 'button'); // Improve accessibility
        questionLink.setAttribute('aria-label', `Go to Question ${index + 1}`);

        listItem.appendChild(questionLink);

        const statusDiv = document.createElement('div');
        statusDiv.style.marginLeft = '15px';
        statusDiv.style.display = 'inline-block';
        statusDiv.style.fontSize = '0.9em';

        let statusText = [];
        if (markedQuestionsRef[index]) {
            statusText.push('<span style="color: orange;">(Marked)</span>');
        }
        if (userAnswersRef[index] !== null && userAnswersRef[index] !== undefined) {
            statusText.push('<span style="color: green;">(Answered)</span>');
        } else {
            statusText.push('<span style="color: red;">(Unanswered)</span>');
        }
        statusDiv.innerHTML = statusText.join(' '); // Use innerHTML to render spans

        listItem.appendChild(statusDiv);
        reviewList.appendChild(listItem);
    });
}

// --- Help Modal Logic ---
export function showHelp() {
    console.log("UI Controller: Showing help modal...");
    if (!helpModal) {
        console.error("Help modal element not found!");
        return;
    }
    helpModal.classList.remove('hidden');
    bodyElement.classList.add('modal-open'); // Reuse bodyElement

    // Add listeners specifically when the modal is opened
    if (closeHelpButton) {
        closeHelpButton.addEventListener('click', closeHelpModal);
    }
    // Optional: Close on background click
    helpModal.addEventListener('click', handleHelpBackgroundClick);
}

function closeHelpModal() {
    console.log("UI Controller: Closing help modal...");
    if (!helpModal) return;
    helpModal.classList.add('hidden');
    bodyElement.classList.remove('modal-open');

    // Remove listeners when closing to prevent memory leaks
    if (closeHelpButton) {
        closeHelpButton.removeEventListener('click', closeHelpModal);
    }
    helpModal.removeEventListener('click', handleHelpBackgroundClick);
}

// Helper for background click closure
function handleHelpBackgroundClick(event) {
    if (event.target === helpModal) { // Check if the click is directly on the modal background
        closeHelpModal();
    }
}

// --- Calculator Modal Logic ---
let calcCurrentInput = '0';
let calcOperator = null;
let calcPreviousInput = null;
let calcWaitingForSecondOperand = false;

// Store the event listener function to allow removal
let calculatorButtonsClickListener = null;

export function openCalculator() {
    console.log("UI Controller: Opening Calculator...");
    if (!calculatorModal || !calculatorDisplay || !calculatorButtons || !closeCalculatorButton) {
        console.error("Calculator elements not found!");
        return;
    }
    // Reset calculator state when opening
    calcCurrentInput = '0';
    calcOperator = null;
    calcPreviousInput = null;
    calcWaitingForSecondOperand = false;
    calculatorDisplay.value = calcCurrentInput;

    calculatorModal.classList.remove('hidden');
    bodyElement.classList.add('modal-open');

    // Attach listeners when opening
    closeCalculatorButton.addEventListener('click', closeCalculatorModal);
    // Remove previous listener before adding a new one to prevent duplicates
    if (calculatorButtonsClickListener) {
        calculatorButtons.removeEventListener('click', calculatorButtonsClickListener);
    }
    calculatorButtonsClickListener = handleCalculatorButtonClick; // Store listener
    calculatorButtons.addEventListener('click', calculatorButtonsClickListener);
}

function closeCalculatorModal() {
    console.log("UI Controller: Closing Calculator...");
    if (!calculatorModal || !calculatorButtons || !closeCalculatorButton) return;

    calculatorModal.classList.add('hidden');
    bodyElement.classList.remove('modal-open');

    // Detach listeners when closing
    closeCalculatorButton.removeEventListener('click', closeCalculatorModal);
    if (calculatorButtonsClickListener) {
        calculatorButtons.removeEventListener('click', calculatorButtonsClickListener);
        calculatorButtonsClickListener = null; // Clear stored listener
    }
}

function handleCalculatorButtonClick(event) {
    const { target } = event;
    if (!target.matches('button')) return; // Only handle button clicks

    const action = target.dataset.action;
    const value = target.textContent;

    if (!action) { // Number button
        inputDigit(value);
    } else if (action === 'decimal') {
        inputDecimal();
    } else if (action === 'clear') {
        clearCalculator();
    } else if (action === 'calculate') {
        handleOperator('='); // Treat '=' as an operator for calculation
    } else { // Operator button (+, -, *, /)
        handleOperator(action);
    }
    // Update display after every button press
    if (calculatorDisplay) calculatorDisplay.value = calcCurrentInput;
}

function inputDigit(digit) {
    if (calcWaitingForSecondOperand) {
        calcCurrentInput = digit;
        calcWaitingForSecondOperand = false;
    } else {
        // Prevent multiple leading zeros
        calcCurrentInput = calcCurrentInput === '0' ? digit : calcCurrentInput + digit;
    }
}

function inputDecimal() {
    if (calcWaitingForSecondOperand) {
        calcCurrentInput = '0.';
        calcWaitingForSecondOperand = false;
        return;
    }
    // If the current input does not contain a decimal point
    if (!calcCurrentInput.includes('.')) {
        calcCurrentInput += '.';
    }
}

function clearCalculator() {
    calcCurrentInput = '0';
    calcOperator = null;
    calcPreviousInput = null;
    calcWaitingForSecondOperand = false;
}

function handleOperator(nextOperator) {
    const inputValue = parseFloat(calcCurrentInput);

    // Handle the first operator or changing operators
    if (calcOperator && calcWaitingForSecondOperand) {
        calcOperator = nextOperator;
        return;
    }

    // If previousInput is null, store the current input as previousInput
    if (calcPreviousInput == null) {
        calcPreviousInput = inputValue;
    } else if (calcOperator) {
        // If there's already an operator, perform the calculation
        const result = performCalculation[calcOperator](calcPreviousInput, inputValue);
        calcCurrentInput = String(result);
        calcPreviousInput = result;
    }

    calcWaitingForSecondOperand = true;
    calcOperator = nextOperator === '=' ? null : nextOperator; // Reset operator if '=' was pressed
}

const performCalculation = {
    '/': (firstOperand, secondOperand) => secondOperand === 0 ? 'Error' : firstOperand / secondOperand,
    '*': (firstOperand, secondOperand) => firstOperand * secondOperand,
    '+': (firstOperand, secondOperand) => firstOperand + secondOperand,
    '-': (firstOperand, secondOperand) => firstOperand - secondOperand,
    // '=': (firstOperand, secondOperand) => secondOperand // '=' doesn't need calculation here, handled in handleOperator
};

// --- Highlighting Logic ---
// Clears any previously applied text highlights
function clearHighlights() {
    // Check if highlightedElements exists and has elements
    if (highlightedElements && highlightedElements.length > 0) {
        console.log(`UI Controller: Clearing ${highlightedElements.length} highlights.`);
        highlightedElements.forEach(span => {
            // Replace the span with its text content
            if (span.parentNode) {
                 const textNode = document.createTextNode(span.textContent);
                 span.parentNode.replaceChild(textNode, span);
                 // Normalize the parent to merge adjacent text nodes
                 span.parentNode.normalize(); 
            } else {
                console.warn("Highlighted span parent not found during clearing.");
            }
        });
    } else {
        // console.log("UI Controller: No highlights to clear.");
    }
     // It might be safer to query again if dynamic highlights are added/removed elsewhere
     // highlightedElements = document.querySelectorAll('.highlight'); 
}

// --- Question Rendering Logic ---
export function renderQuestionUI(questionData, currentIndex, totalQuestions, userAnswer, isMarked) {
    console.log(`UI Controller: Rendering question ${currentIndex + 1}`);
    if (!questionData) {
        console.error("renderQuestionUI: questionData is missing!");
        if (questionTextDiv) questionTextDiv.innerHTML = '<p style="color: red;">Error: Question data is missing.</p>';
        if (optionsList) optionsList.innerHTML = '';
        return;
    }

    // 1. Clear previous highlights
    clearHighlights();

    // 2. Update Question Header Info
    if (questionNumberSpan) questionNumberSpan.textContent = currentIndex + 1;
    if (totalQuestionsSpan) totalQuestionsSpan.textContent = totalQuestions;
    if (examSectionItemSpan) examSectionItemSpan.textContent = questionData.section || 'N/A'; // Handle missing section

    // 3. Display Question Text (use innerHTML to render potential formatting)
    if (questionTextDiv) {
        // Use 'text' property from JSON, provide fallback
        questionTextDiv.innerHTML = questionData.text || "Error: Question text missing.";
    } else {
        console.error("Question text div not found for question", currentIndex);
    }

    // 4. Clear previous options and feedback/explanation
    if (optionsList) optionsList.innerHTML = '';
    if (feedbackDiv) feedbackDiv.innerHTML = '';
    if (explanationDiv) explanationDiv.innerHTML = '';
    if (feedbackDiv) feedbackDiv.classList.add('hidden');
    if (explanationDiv) explanationDiv.classList.add('hidden');

    // 5. Populate Options
    if (questionData.options && optionsList) {
        if (typeof questionData.options === 'object' && questionData.options !== null && !Array.isArray(questionData.options)) {
            Object.entries(questionData.options).forEach(([optionKey, optionText], optionIndex) => {
                const listItem = document.createElement('li');
                listItem.classList.add('option');

                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'option';
                input.value = optionKey;
                input.id = `option-${optionIndex}`;
                // Check if this option was the user's previous answer
                if (userAnswer === optionKey) {
                    input.checked = true;
                }

                const label = document.createElement('label');
                label.htmlFor = `option-${optionIndex}`;
                // Use innerHTML for options in case they contain formatting
                label.innerHTML = `${optionKey}. ${optionText}`; 

                listItem.appendChild(input);
                listItem.appendChild(label);
                optionsList.appendChild(listItem);
            });
        } else if (Array.isArray(questionData.options)) {
            questionData.options.forEach((optionText, optionIndex) => {
                const listItem = document.createElement('li');
                listItem.classList.add('option');

                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'option';
                input.value = optionIndex;
                input.id = `option-${optionIndex}`;
                // Check if this option was the user's previous answer
                if (userAnswer === optionIndex) {
                    input.checked = true;
                }

                const label = document.createElement('label');
                label.htmlFor = `option-${optionIndex}`;
                // Use innerHTML for options in case they contain formatting
                label.innerHTML = `${String.fromCharCode(65 + optionIndex)}. ${optionText}`; 

                listItem.appendChild(input);
                listItem.appendChild(label);
                optionsList.appendChild(listItem);
            });
        } else {
            console.error(`Question ${currentIndex} options format is invalid:`, questionData.options);
            optionsList.innerHTML = '<li>Error: Invalid options format</li>';
        }
    } else {
        console.error("Options list element not found or no options provided for question", currentIndex);
        if (optionsList) optionsList.innerHTML = '<li>Error loading options.</li>'; // Provide feedback
    }

    // 6. Update 'Mark Question' Checkbox
    if (markCheckbox) {
        markCheckbox.checked = isMarked;
    }

    // 7. Show Feedback/Explanation if already answered
    if (userAnswer !== null && userAnswer !== undefined) {
        console.log(`UI Controller: Question ${currentIndex + 1} previously answered. Showing feedback.`);
        if (feedbackDiv) {
            const correctAnswerIndex = questionData.answer;
            const isCorrect = userAnswer === correctAnswerIndex;
            feedbackDiv.innerHTML = isCorrect
                ? `<p class="correct">Correct!</p>`
                : `<p class="incorrect">Incorrect. The correct answer was option ${correctAnswerIndex !== undefined ? correctAnswerIndex + 1 : 'N/A'}.</p>`;
            feedbackDiv.classList.remove('hidden');
        }
        if (explanationDiv && questionData.explanation) {
            explanationDiv.innerHTML = `<p><strong>Explanation:</strong> ${questionData.explanation}</p>`;
            explanationDiv.classList.remove('hidden');
        } else if (explanationDiv) {
             explanationDiv.innerHTML = `<p><strong>Explanation:</strong> Not available.</p>`; // Show placeholder if missing
             explanationDiv.classList.remove('hidden'); // Still show the section
        }
    }
}

// --- Navigation Button Updates ---
export function updateNavigationButtons(currentIndex, totalQuestions) {
    console.log(`UI Controller: Updating nav buttons for index ${currentIndex} / ${totalQuestions}`);
    if (prevButton) {
        prevButton.disabled = currentIndex === 0;
    }
    if (nextButton) {
        // Check if it's the last question
        if (currentIndex === totalQuestions - 1) {
            nextButton.textContent = 'Submit Exam';
            nextButton.classList.add('submit-exam-button'); // Optional: Add class for styling
        } else {
            nextButton.textContent = 'Next';
            nextButton.classList.remove('submit-exam-button'); // Optional: Remove class
        }
        // The button should generally be enabled unless there are no questions
        nextButton.disabled = totalQuestions === 0;
    }
}

// --- View Toggling Logic ---
/**
 * Controls which main view is displayed ('welcome', 'exam', 'report').
 * @param {'welcome' | 'exam' | 'report'} viewName The name of the view to show.
 */
export function showView(viewName) {
    console.log(`UI Controller: Showing view - ${viewName}`);

    // Ensure all containers exist before manipulating them
    if (!welcomeScreenDiv || !appContainerDiv || !examArea || !reportArea) {
        console.error("UI Controller: Cannot switch views, one or more layout containers missing!");
        return;
    }

    // Hide all top-level containers initially
    welcomeScreenDiv.style.display = 'none';
    appContainerDiv.style.display = 'none'; // Hides examArea and reportArea too

    switch (viewName) {
        case 'welcome':
            welcomeScreenDiv.style.display = 'block'; // Or 'flex', etc.
            // Ensure app elements are hidden when welcome is shown
            if (headerElement) headerElement.classList.add('hidden');
            if (mainWrapper) mainWrapper.classList.add('hidden');
            if (footerElement) footerElement.classList.add('hidden');
            disableControls(); // Keep controls disabled on welcome screen
            break;
        case 'exam':
            appContainerDiv.style.display = 'block'; // Show the main app container
            examArea.classList.remove('hidden');
            reportArea.classList.add('hidden');
            // Make header, wrapper, and footer visible for the exam
            if (headerElement) headerElement.classList.remove('hidden');
            if (mainWrapper) mainWrapper.classList.remove('hidden');
            if (footerElement) footerElement.classList.remove('hidden');
            enableControls(); // Enable controls for the exam
            break;
        case 'report':
            appContainerDiv.style.display = 'block'; // Show the main app container
            examArea.classList.add('hidden');
            reportArea.classList.remove('hidden');
            // Hide header and footer, keep wrapper potentially for report styling
            if (headerElement) headerElement.classList.add('hidden');
            if (mainWrapper) mainWrapper.classList.add('hidden'); // Assuming report doesn't use main-wrapper layout
            if (footerElement) footerElement.classList.add('hidden');
            disableControls(); // Disable exam controls on report screen
            // Note: Ensure restart button is handled separately if needed
            break;
        default:
            console.error(`UI Controller: Unknown view name '${viewName}'. Defaulting to welcome view.`);
            welcomeScreenDiv.style.display = 'block';
            disableControls();
    }
}

// --- Event Listener Setup for UI Controller ---
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme(); // Apply theme on load

    // Dark Mode Toggle Listener
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
        console.log("Dark mode toggle listener attached.");
    } else {
        console.warn("Dark mode toggle element not found.");
    }

    // Show the initial welcome screen
    showView('welcome');

    // Other initializations if needed
});
