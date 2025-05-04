// --- Renderer Process Logic ---

// --- Imports ---
import { loadQuestions } from "./examManager.js";
import {
  renderQuestionUI,
  updateNavigationButtons,
  showView,
  enableControls,
  disableControls,
  applySavedTheme, // Needed for initial load
  openReviewModal,
  openHelpModal,
  openCalculatorModal,
  showLabValues, // Correct function to call
  toggleDarkMode,
  setStrikethroughReference, // Pass the strikethrough state reference
} from "./uiController.js";
import { generateReport } from "./reportGenerator.js";
import { startTimer, stopTimer, togglePause } from "./timer.js"; // Import timer controls

// --- State Variables ---
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = []; // Stores selected option value ('A', 'B' or '0', '1', etc.)
let markedQuestions = []; // Array of booleans
let crossedOutOptions = {}; // Object: { questionIndex: Set(['A', 'C']) }
let examFilename = null; // Store the loaded exam filename

// --- DOM Elements ---
// Buttons that trigger actions managed here or passed to uiController
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const markCheckbox = document.getElementById("mark-question");
const labValuesButton = document.getElementById("lab-values-button");
const calculatorButton = document.getElementById("calculator-button");
const reviewButton = document.getElementById("review-button");
const helpButton = document.getElementById("help-button");
const darkModeToggle = document.getElementById("dark-mode-toggle"); // Button, not checkbox
const pauseButton = document.getElementById("pause-button"); // Handled by timer.js

// Main containers/areas
const reportContainer = document.getElementById("report-container");
const reportContentElement = document.getElementById("report-content");
const restartButton = document.getElementById("restart-button");
const downloadPdfButton = document.getElementById("download-report-pdf");

// --- Functions ---

function renderCurrentQuestion() {
  console.log(`Renderer: Rendering question index ${currentQuestionIndex}`);
  if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
    console.error(`Invalid question index: ${currentQuestionIndex}`);
    return;
  }
  const question = questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestionIndex];
  const isMarked = markedQuestions[currentQuestionIndex];

  // Call UI controller function to update the DOM
  renderQuestionUI(
    question,
    currentQuestionIndex,
    questions.length,
    userAnswer,
    isMarked
  );
  updateNavigationButtons(currentQuestionIndex, questions.length);
}

function handleNavigatePrevious() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderCurrentQuestion();
  }
}

function handleNavigateNext() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  } else {
    // Last question reached, button now says "Finish Exam"
    endExam();
  }
}

function handleMarkQuestionChange() {
  if (markCheckbox) {
    // Check if element exists
    markedQuestions[currentQuestionIndex] = markCheckbox.checked;
    console.log(
      `Renderer: Question ${currentQuestionIndex} marked status: ${markCheckbox.checked}`
    );
  }
}

// --- Event Handlers for UI Controller Events ---

function handleOptionSelected(event) {
  const { questionIndex, selectedValue } = event.detail;
  if (questionIndex >= 0 && questionIndex < userAnswers.length) {
    console.log(
      `Renderer: Storing answer for question ${questionIndex}: ${selectedValue}`
    );
    userAnswers[questionIndex] = selectedValue;
  } else {
    console.error(
      `Renderer: Invalid questionIndex (${questionIndex}) for storing answer.`
    );
  }
}

function handleOptionStrikethroughToggled(event) {
  const { questionIndex, optionLetter } = event.detail;
  if (questionIndex >= 0 && questionIndex < questions.length) {
    if (!crossedOutOptions[questionIndex]) {
      crossedOutOptions[questionIndex] = new Set();
    }
    if (crossedOutOptions[questionIndex].has(optionLetter)) {
      crossedOutOptions[questionIndex].delete(optionLetter);
      console.log(
        `Renderer: Removed strikethrough for Q${questionIndex}, Option ${optionLetter}`
      );
    } else {
      crossedOutOptions[questionIndex].add(optionLetter);
      console.log(
        `Renderer: Added strikethrough for Q${questionIndex}, Option ${optionLetter}`
      );
      // Also clear the answer if the struck-out option was selected
      if (
        userAnswers[questionIndex] === optionLetter ||
        String(userAnswers[questionIndex]) === optionLetter
      ) {
        userAnswers[questionIndex] = null;
        console.log(
          `Renderer: Cleared answer for Q${questionIndex} because selected option was struck out.`
        );
        // Re-render to show selection removed (optional, uiController handles immediate UI)
        // renderCurrentQuestion();
      }
    }
  } else {
    console.error(
      `Renderer: Invalid questionIndex (${questionIndex}) for strikethrough toggle.`
    );
  }
}

function handleNavigateToQuestion(event) {
  const { questionIndex } = event.detail;
  if (questionIndex >= 0 && questionIndex < questions.length) {
    console.log(
      `Renderer: Navigating to question ${questionIndex} from review.`
    );
    currentQuestionIndex = questionIndex;
    renderCurrentQuestion();
  } else {
    console.error(
      `Renderer: Invalid question index (${questionIndex}) requested for navigation.`
    );
  }
}

// --- Exam Lifecycle Functions ---

export function endExam() {
  console.log("Renderer: Ending exam...");
  stopTimer(); // Stop the timer
  disableControls(); // Disable footer buttons etc.

  // Calculate score
  let correctCount = 0;
  questions.forEach((q, index) => {
    // Handle both object ('A') and array (0) based answers - Assuming OBJECT format now
    let isCorrect = false;
    const userAnswer = userAnswers[index];
    const correctAnswerKey = q.correctAnswer; // USE CORRECT FIELD NAME
    const options = q.options;

    if (options && typeof options === "object" && !Array.isArray(options)) {
      // Object format: q.correctAnswer is 'A', userAnswer is 'A'
      const isValidUserAnswer =
        userAnswer !== null && options.hasOwnProperty(userAnswer);
      const isValidCorrectAnswer =
        correctAnswerKey !== null && options.hasOwnProperty(correctAnswerKey);
      isCorrect =
        isValidUserAnswer &&
        isValidCorrectAnswer &&
        userAnswer === correctAnswerKey;
    } else {
      console.warn(
        `Cannot determine correctness for question ${index} due to missing/invalid options object.`
      );
    }
    if (isCorrect) {
      correctCount++;
    }
  });
  const scoreData = { correctCount, totalQuestions: questions.length };

  console.log(
    `Renderer: Exam finished. Score: ${scoreData.correctCount}/${scoreData.totalQuestions}`
  );

  // Generate and display the report
  if (reportContentElement) {
    generateReport(
      reportContentElement,
      questions,
      userAnswers,
      scoreData,
      markedQuestions
    );
    showView("report"); // Switch UI to the report view
  } else {
    console.error("Cannot display report: report content element not found.");
    // Maybe show an alert as a fallback
    alert(
      `Exam Finished! Score: ${scoreData.correctCount} / ${scoreData.totalQuestions}`
    );
    showView("welcome"); // Go back to welcome screen if report can't be shown
  }
}

function restartExam() {
  console.log("Renderer: Restarting exam...");
  // Stop any running timer (important)
  stopTimer();
  // Reset state variables
  questions = [];
  currentQuestionIndex = 0;
  userAnswers = [];
  markedQuestions = [];
  crossedOutOptions = {};
  examFilename = null; // Clear filename

  // Show the welcome screen again
  showView("welcome");

  // Re-populate the exam list on the welcome screen
  // Assuming welcomeScreen.js has a function for this, we might need to call it
  // For now, the user will manually select again.
  // If welcomeScreen.js uses DOMContentLoaded, a full reload might be simpler,
  // but let's try just showing the view.
  // We might need to explicitly call populateExamList from welcomeScreen.js if it's exported.
  // Or, the welcomeScreen.js could re-populate when its view becomes visible.
}

async function downloadReportAsPDF() {
  console.log("Renderer: Generating PDF via Electron API...");
  try {
    const result = await window.electronAPI.printToPDF();
    if (result && result.success) {
      console.log(`Renderer: PDF saved to ${result.filePath}`);
      alert(`PDF successfully saved to:\n${result.filePath}`);
    } else {
      console.warn("Renderer: PDF generation was cancelled or failed.");
      alert("PDF generation was cancelled or failed.");
    }
  } catch (error) {
    console.error("Renderer: Error during PDF generation:", error);
    alert(`Error generating PDF: ${error.message}`);
  }
}

// --- Initialization and Event Listeners ---

// Function called by welcomeScreen.js when 'Start Exam' is clicked
export async function initializeExam(selectedFilename) {
  console.log(`Renderer: Initializing exam with file: ${selectedFilename}`);
  examFilename = selectedFilename; // Store filename

  // Show loading state? (Optional, handled by uiController?)
  // showLoadingState("Loading exam...");

  try {
    questions = await loadQuestions(selectedFilename);
    if (questions.length === 0) {
      throw new Error("Exam file loaded, but it contains no questions.");
    }
    console.log(`Renderer: Successfully loaded ${questions.length} questions.`);

    // Initialize state arrays based on loaded questions
    currentQuestionIndex = 0;
    userAnswers = new Array(questions.length).fill(null);
    markedQuestions = new Array(questions.length).fill(false);
    crossedOutOptions = {}; // Reset strikethroughs
    questions.forEach((_, index) => {
      crossedOutOptions[index] = new Set(); // Initialize empty sets
    });

    // Pass the reference to the state variable to uiController
    setStrikethroughReference(crossedOutOptions);

    // Render the first question
    renderCurrentQuestion();

    // Enable UI controls (buttons, etc.)
    enableControls();

    // Start the timer (using default or potentially from exam data)
    // Example: const examDuration = questions[0]?.examDuration || 150 * 90; // Get from data or use default
    const secondsPerQuestion = 90; // 90 seconds per question
    const examDuration = questions.length * secondsPerQuestion; // Use actual question count
    console.log(
      `Renderer: Starting timer with ${questions.length} questions (${examDuration} seconds)`
    );
    startTimer(examDuration);

    // Show the main exam view (already done by welcomeScreen? Redundant?)
    // Remove this redundant call
    // showView("exam"); // Ensure exam view is shown

    // hideLoadingState(); // Hide loading indicator
  } catch (error) {
    console.error("Renderer: Failed to initialize exam:", error);
    // Display error to user (e.g., in the welcome screen's message area or an alert)
    // hideLoadingState();
    showView("welcome"); // Go back to welcome screen on error
    const loadingMessage = document.getElementById("loading-message");
    if (loadingMessage) {
      loadingMessage.textContent = `Error starting exam: ${error.message}`;
    } else {
      alert(`Error starting exam: ${error.message}`);
    }
  }
}

// Setup listeners for main exam controls and global events
function setupExamControlListeners() {
  console.log("Renderer: Setting up exam control listeners...");

  // Navigation
  if (prevButton) prevButton.addEventListener("click", handleNavigatePrevious);
  if (nextButton) nextButton.addEventListener("click", handleNavigateNext);

  // Question actions
  if (markCheckbox)
    markCheckbox.addEventListener("change", handleMarkQuestionChange);

  // Utility Buttons
  if (labValuesButton) labValuesButton.addEventListener("click", showLabValues); // Use imported UI function
  if (calculatorButton)
    calculatorButton.addEventListener("click", openCalculatorModal);
  if (reviewButton) {
    // Ensure state arrays are passed here
    reviewButton.addEventListener("click", () =>
      openReviewModal(questions, userAnswers, markedQuestions)
    );
  }
  if (helpButton) helpButton.addEventListener("click", openHelpModal);
  if (darkModeToggle) darkModeToggle.addEventListener("click", toggleDarkMode);
  // Pause button listener is set up within timer.js

  // Report Screen Buttons
  if (restartButton) restartButton.addEventListener("click", restartExam);
  if (downloadPdfButton)
    downloadPdfButton.addEventListener("click", downloadReportAsPDF);

  // Listen for custom events from UI Controller
  document.removeEventListener("optionSelected", handleOptionSelected);
  document.addEventListener("optionSelected", handleOptionSelected);

  document.removeEventListener(
    "optionStrikethroughToggled",
    handleOptionStrikethroughToggled
  );
  document.addEventListener(
    "optionStrikethroughToggled",
    handleOptionStrikethroughToggled
  );

  // Listen for timer end event
  document.removeEventListener("timerEnd", endExam); // Remove previous if any
  document.addEventListener("timerEnd", endExam);

  console.log("Renderer: Exam control listeners attached.");
  // Note: It might be beneficial to have a teardown function to remove these listeners
  // when the exam ends or restarts, especially the document listeners.
}

// --- Initial Page Load Setup ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("Renderer: DOM fully loaded and parsed");

  // Apply saved theme preference on load
  applySavedTheme();

  // Setup listeners that depend on the DOM being ready
  setupExamControlListeners();

  // Setup listeners for events dispatched from uiController
  document.addEventListener("optionSelected", handleOptionSelected);
  document.addEventListener(
    "optionStrikethroughToggled",
    handleOptionStrikethroughToggled
  );
  document.addEventListener("navigateToQuestion", handleNavigateToQuestion);

  // Setup listener for the timer ending
  document.addEventListener("timerEnd", () => {
    console.log("Renderer: Received timerEnd event. Calling endExam.");
    endExam();
  });

  // Initialize Welcome Screen (or other initial setup)
  // Assuming welcomeScreen.js handles its own initialization
  showView("welcome"); // Start by showing the welcome screen
});

console.log("renderer.js loaded");
