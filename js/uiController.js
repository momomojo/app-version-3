// --- UI Controller ---
// Manages UI elements like buttons, modals, dark mode, etc.
import { openLabValuesPanel, closeLabValuesPanel } from "./labValues.js"; // Import functions to toggle lab panel

// --- DOM Elements ---
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const markCheckbox = document.getElementById("mark-question");
// Review Modal
const reviewModal = document.getElementById("review-modal");
const reviewList = document.getElementById("review-list");
const filterRadios = document.querySelectorAll('input[name="reviewFilter"]'); // Fix to match HTML's attribute
const closeReviewButton = document.getElementById("close-review-modal");
// Help Modal
const helpModal = document.getElementById("help-modal");
const closeHelpButton = document.getElementById("close-help-modal");
// Calculator Modal
const calculatorModal = document.getElementById("calculator-modal");
const closeCalculatorButton = document.getElementById("close-calculator-modal");
const calculatorDisplay = document.getElementById("calculator-display");
const calculatorButtons = document.getElementById("calculator-buttons"); // Grid container
// Lab Panel
const labValuesPanel = document.getElementById("lab-values-panel");
const closeLabPanelButton = document.getElementById("close-lab-panel"); // Already handled in labValues.js
// Main Layout & Shared
const mainWrapper = document.querySelector(".main-wrapper");
const bodyElement = document.body;
const darkModeToggle = document.getElementById("dark-mode-toggle");
const welcomeScreenDiv = document.getElementById("welcome-screen");
const appContainerDiv = document.getElementById("app-container");
const headerElement = document.querySelector("header");
const footerElement = document.querySelector("footer");
const examArea = document.getElementById("question-area");
const reportArea = document.getElementById("report-container");
// Question Rendering Elements
const examSectionItemSpan = document.getElementById("exam-section-item");
const questionTextDiv = document.getElementById("question-text");
const optionsList = document.getElementById("options-list");
const feedbackDiv = document.getElementById("feedback");
const explanationDiv = document.getElementById("explanation");

// Remove references to state variables managed elsewhere
// let questionsRef = [];
// let userAnswersRef = [];
// let markedQuestionsRef = [];

// Function to set references from the module that holds the state (e.g., renderer.js)
// export function setUiControllerReferences(
//   questions,
//   userAnswers,
//   markedQuestions
// ) {
//   console.log("UI Controller: Setting state references...");
//   questionsRef = questions;
//   userAnswersRef = userAnswers;
//   markedQuestionsRef = markedQuestions;
// }

// --- UI Controls Enable/Disable ---
export function enableControls() {
  console.log("UI Controller: Enabling controls...");
  if (prevButton) prevButton.disabled = false;
  if (nextButton) nextButton.disabled = false;
  if (markCheckbox) markCheckbox.disabled = false;
  if (darkModeToggle) darkModeToggle.disabled = false;
  const labButton = document.getElementById("lab-values-button");
  const calcButton = document.getElementById("calculator-button");
  const reviewButton = document.getElementById("review-button");
  const helpButton = document.getElementById("help-button");
  const pauseButton = document.getElementById("pause-button");
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
  const labButton = document.getElementById("lab-values-button");
  const calcButton = document.getElementById("calculator-button");
  const reviewButton = document.getElementById("review-button");
  const helpButton = document.getElementById("help-button");
  const pauseButton = document.getElementById("pause-button");
  if (labButton) labButton.disabled = true;
  if (calcButton) calcButton.disabled = true;
  if (reviewButton) reviewButton.disabled = true;
  if (helpButton) helpButton.disabled = true;
  if (pauseButton) pauseButton.disabled = true;
}

// --- Dark Mode Functions ---
function enableDarkMode() {
  bodyElement.classList.add("dark-mode");
  // No toggle checkbox needed here, just apply the class
  localStorage.setItem("theme", "dark");
  console.log("Dark Mode Enabled");
}

function disableDarkMode() {
  bodyElement.classList.remove("dark-mode");
  localStorage.setItem("theme", "light");
  console.log("Dark Mode Disabled");
}

export function toggleDarkMode() {
  if (bodyElement.classList.contains("dark-mode")) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
}

export function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    enableDarkMode();
  } else {
    disableDarkMode(); // Default to light
  }
}

// --- Modal Opening/Closing Logic ---
function openModal(modalElement) {
  if (!modalElement) {
    console.error("Cannot open modal: Element not found.");
    return;
  }
  modalElement.style.display = "block";
  modalElement.classList.remove("hidden");
  bodyElement.classList.add("modal-open");
}

function closeModal(modalElement) {
  if (!modalElement) {
    console.error("Cannot close modal: Element not found.");
    return;
  }
  modalElement.style.display = "none";
  modalElement.classList.add("hidden");
  // Only remove modal-open if no other modals are open
  // Simple check: are any elements with class 'modal' not hidden?
  const anyModalOpen = Array.from(document.querySelectorAll(".modal")).some(
    (modal) => !modal.classList.contains("hidden")
  );
  if (!anyModalOpen) {
    bodyElement.classList.remove("modal-open");
  }
}

// --- Review Modal Logic ---
let reviewListClickListener = null;

// Modify openReviewModal to accept state arrays
export function openReviewModal(questions, userAnswers, markedQuestions) {
  console.log("UI Controller: Opening Review Modal...");
  if (!reviewModal) {
    console.error("UI Controller: Review modal element not found!");
    return;
  }

  // Make sure filter radios are accessible
  if (!filterRadios || filterRadios.length === 0) {
    console.error("UI Controller: Review filter radio buttons not found!");
  } else {
    console.log(
      `UI Controller: Found ${filterRadios.length} filter radio buttons`
    );

    // Get currently selected filter (or default to 'all')
    let currentFilter = "all";
    for (const radio of filterRadios) {
      if (radio.checked) {
        currentFilter = radio.value;
        break;
      }
    }

    // Find and check the 'all' filter first if no filter is selected
    if (currentFilter === "all" || !currentFilter) {
      const allFilterRadio = Array.from(filterRadios).find(
        (radio) => radio.value === "all"
      );
      if (allFilterRadio) {
        allFilterRadio.checked = true;
      }
    }
  }

  // Pass state arrays to populateReviewList with the current filter
  populateReviewList(
    questions,
    userAnswers,
    markedQuestions,
    getCurrentFilter()
  );
  openModal(reviewModal);

  // Define the filter change listener
  const filterChangeListener = (event) => {
    console.log(`UI Controller: Filter changed to ${event.target.value}`);
    populateReviewList(
      questions,
      userAnswers,
      markedQuestions,
      event.target.value
    );
  };

  if (closeReviewButton) {
    // Use an anonymous function for the close listener
    const closeHandler = () => {
      closeModal(reviewModal);
      // Clean up filter listeners when modal closes
      filterRadios.forEach((radio) => {
        radio.removeEventListener("change", filterChangeListener);
      });
    };
    closeReviewButton.addEventListener("click", closeHandler, { once: true });
  }

  // Remove previous listeners and add new ones
  filterRadios.forEach((radio) => {
    radio.removeEventListener("change", filterChangeListener);
    radio.addEventListener("change", filterChangeListener);
  });
}

// Helper function to get the currently selected filter
function getCurrentFilter() {
  if (!filterRadios || filterRadios.length === 0) return "all";

  for (const radio of filterRadios) {
    if (radio.checked) {
      return radio.value;
    }
  }

  return "all"; // Default if none selected
}

// Modify populateReviewList signature and usage of state variables
function populateReviewList(
  questions,
  userAnswers,
  markedQuestions,
  filter = "all"
) {
  console.log(`UI Controller: Populating review list with filter: ${filter}`);
  if (!reviewList) {
    console.error("UI Controller: Review list element not found!");
    return;
  }

  // Check if the passed arrays are valid
  if (
    !questions ||
    !userAnswers ||
    !markedQuestions ||
    questions.length === 0
  ) {
    console.error(
      "UI Controller: Invalid or empty state arrays passed to populateReviewList!"
    );
    reviewList.innerHTML = "<li>Error: Exam state not available.</li>";
    return;
  }

  reviewList.innerHTML = ""; // Clear previous list
  const numQuestions = questions.length;
  let filteredIndices = [];

  // Add a summary counter message
  const statsDiv = document.createElement("div");
  statsDiv.className = "review-stats";
  let answeredCount = 0;
  let unansweredCount = 0;
  let markedCount = 0;

  // Count the stats first
  for (let i = 0; i < numQuestions; i++) {
    const isAnswered = userAnswers[i] !== null && userAnswers[i] !== undefined;
    const isMarked = markedQuestions[i] === true;

    if (isAnswered) answeredCount++;
    else unansweredCount++;
    if (isMarked) markedCount++;

    // Apply filtering
    let include = false;
    switch (filter) {
      case "answered":
        include = isAnswered;
        break;
      case "unanswered":
        include = !isAnswered;
        break;
      case "marked":
        include = isMarked;
        break;
      default:
        include = true; // "all" filter
        break;
    }

    if (include) filteredIndices.push(i);
  }

  // Add stats message at the top
  statsDiv.innerHTML = `
    <div>Total: <strong>${numQuestions}</strong> questions</div>
    <div>Answered: <strong>${answeredCount}</strong> | Unanswered: <strong>${unansweredCount}</strong> | Marked: <strong>${markedCount}</strong></div>
    <div>Showing <strong>${filteredIndices.length}</strong> questions with filter: <strong>${filter}</strong></div>
  `;
  reviewList.appendChild(statsDiv);

  // Display message if no questions match the filter
  if (filteredIndices.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "no-matching-questions";
    emptyMessage.textContent = `No questions match the "${filter}" filter.`;
    reviewList.appendChild(emptyMessage);
    return;
  }

  // Create and add items for matching questions
  filteredIndices.forEach((index) => {
    const listItem = document.createElement("li");
    const isAnswered =
      userAnswers[index] !== null && userAnswers[index] !== undefined;
    const isMarked = markedQuestions[index] === true;

    // Create status indicators
    const statusList = [];
    if (isAnswered)
      statusList.push('<span class="status status-answered">Answered</span>');
    else
      statusList.push(
        '<span class="status status-unanswered">Unanswered</span>'
      );
    if (isMarked)
      statusList.push('<span class="status status-marked">Marked</span>');

    const statusHTML = statusList.join(" ");

    // Create the list item with enhanced styling
    listItem.innerHTML = `
      <div class="review-item-number">Question ${index + 1}</div>
      <div class="review-item-status">${statusHTML}</div>
    `;

    // Make the whole item clickable
    listItem.className = "review-list-item";
    if (isMarked) listItem.classList.add("item-marked");
    if (!isAnswered) listItem.classList.add("item-unanswered");

    // Add click listener to navigate to the question
    listItem.addEventListener("click", () => {
      console.log(
        `UI Controller: Review item ${
          index + 1
        } clicked. Dispatching navigateToQuestion.`
      );
      const navigateEvent = new CustomEvent("navigateToQuestion", {
        detail: { questionIndex: index },
        bubbles: true,
      });
      document.dispatchEvent(navigateEvent);
      closeModal(reviewModal);
    });

    reviewList.appendChild(listItem);
  });
}

// --- Help Modal Logic ---
export function openHelpModal() {
  console.log("UI Controller: Opening Help Modal...");
  if (!helpModal) return;
  openModal(helpModal);
  if (closeHelpButton) {
    closeHelpButton.addEventListener("click", () => closeModal(helpModal), {
      once: true,
    });
  }
  // Optional: Add background click listener to close
  helpModal.addEventListener("click", handleModalBackgroundClick, {
    once: true,
  });
}

// --- Calculator Logic ---
let firstOperand = "";
let secondOperand = "";
let currentOperator = null;
let shouldResetDisplay = false;

export function openCalculatorModal() {
  console.log("UI Controller: Opening Calculator Modal...");
  if (!calculatorModal) return;
  clearCalculator(); // Reset on open
  openModal(calculatorModal);

  // Define the close handler function once
  const closeHandler = () => {
    closeModal(calculatorModal);
    // Remove the button listener when closing
    if (calculatorButtons) {
      calculatorButtons.removeEventListener(
        "click",
        handleCalculatorButtonClick
      );
    }
    // Remove the background click listener (if it was added)
    calculatorModal.removeEventListener("click", handleModalBackgroundClick);
  };

  if (closeCalculatorButton) {
    // Use the defined handler, ensure it's removed after firing
    closeCalculatorButton.addEventListener("click", closeHandler, {
      once: true,
    });
  }

  // Add listener for calculator buttons
  if (calculatorButtons) {
    // Remove any previous listener before adding a new one (belt-and-suspenders)
    calculatorButtons.removeEventListener("click", handleCalculatorButtonClick);
    calculatorButtons.addEventListener("click", handleCalculatorButtonClick);
  }

  // Optional: Add background click listener to close
  // Ensure this listener also uses the same cleanup logic
  calculatorModal.addEventListener(
    "click",
    (event) => {
      // Check if the click is on the background itself
      if (event.target === calculatorModal) {
        closeHandler();
      }
    },
    { once: true }
  ); // Let's try once:true here too, simpler cleanup
}

function handleCalculatorButtonClick(event) {
  const target = event.target;
  if (target.tagName !== "BUTTON") return; // Ignore clicks outside buttons

  event.stopPropagation(); // Prevent background click handler from firing

  const value = target.dataset.value;

  if (value >= "0" && value <= "9") {
    inputDigit(value);
  } else if (value === ".") {
    inputDecimal();
  } else if (value === "C") {
    clearCalculator();
  } else if (value === "=") {
    calculateResult();
  } else {
    // Operator (+, -, *, /)
    handleOperator(value);
  }
}

function updateCalculatorDisplay(value) {
  if (calculatorDisplay) calculatorDisplay.value = value;
}

function inputDigit(digit) {
  if (calculatorDisplay.value === "0" || shouldResetDisplay) {
    updateCalculatorDisplay(digit);
    shouldResetDisplay = false;
  } else {
    updateCalculatorDisplay(calculatorDisplay.value + digit);
  }
}

function inputDecimal() {
  if (shouldResetDisplay) {
    updateCalculatorDisplay("0.");
    shouldResetDisplay = false;
    return;
  }
  if (!calculatorDisplay.value.includes(".")) {
    updateCalculatorDisplay(calculatorDisplay.value + ".");
  }
}

function clearCalculator() {
  firstOperand = "";
  secondOperand = "";
  currentOperator = null;
  shouldResetDisplay = false;
  updateCalculatorDisplay("0");
}

function handleOperator(nextOperator) {
  const inputValue = parseFloat(calculatorDisplay.value);

  if (currentOperator && !shouldResetDisplay) {
    // If there's already an operator and we haven't just calculated,
    // perform the previous operation first
    secondOperand = inputValue;
    const result = performCalculation();
    updateCalculatorDisplay(String(result));
    firstOperand = String(result);
  } else {
    // First operator or operator after calculation
    firstOperand = calculatorDisplay.value;
  }

  currentOperator = nextOperator;
  shouldResetDisplay = true; // Next digit input should clear the display
}

function calculateResult() {
  if (currentOperator === null || shouldResetDisplay) {
    // Nothing to calculate or tried hitting = twice
    return;
  }
  if (secondOperand === "") {
    // Allow using the current display value if = is pressed after operator
    secondOperand = calculatorDisplay.value;
  } else {
    // If second operand was set by previous calc, use firstOperand
    // This logic might need refinement depending on desired behavior
    // For now, assume the display holds the second operand
    secondOperand = calculatorDisplay.value;
  }

  const result = performCalculation();
  updateCalculatorDisplay(String(result));
  currentOperator = null;
  firstOperand = String(result); // Store result for potential chaining
  secondOperand = "";
  // shouldResetDisplay remains true? Or set to false? Let's set to true so next digit starts new number
  shouldResetDisplay = true;
}

function performCalculation() {
  const prev = parseFloat(firstOperand);
  const current = parseFloat(secondOperand);
  if (isNaN(prev) || isNaN(current)) return NaN; // Handle potential parse errors

  switch (currentOperator) {
    case "+":
      return prev + current;
    case "-":
      return prev - current;
    case "*":
      return prev * current;
    case "/":
      return current === 0 ? "Error" : prev / current;
    default:
      return current; // Should not happen
  }
}

// --- Lab Panel Control ---
// The actual panel logic is in labValues.js
// This function is called by the button listener in renderer.js
export function showLabValues() {
  console.log("UI Controller: Toggling Lab Values panel...");
  // Get reference to the main wrapper to check if panel is active
  const mainWrapper = document.querySelector(".main-wrapper");

  // Check if the panel is already open
  if (mainWrapper && mainWrapper.classList.contains("lab-panel-active")) {
    console.log("UI Controller: Lab panel is already open, closing it...");
    // Close the panel by directly calling the close function
    if (typeof closeLabValuesPanel === "function") {
      closeLabValuesPanel();
    } else {
      // Fallback if close function isn't available (or imported)
      console.log(
        "UI Controller: closeLabValuesPanel not found, removing class directly"
      );
      mainWrapper.classList.remove("lab-panel-active");
    }
  } else {
    // Panel is not open, so open it
    console.log("UI Controller: Opening Lab Values panel...");
    // Call the function imported from labValues.js
    if (typeof openLabValuesPanel === "function") {
      openLabValuesPanel();
    } else {
      console.error("openLabValuesPanel function not found or not imported!");
    }
  }
}

// --- Helper for Modal Background Clicks ---
function handleModalBackgroundClick(event) {
  // Close modal only if the click target *is* the modal container itself
  // (the semi-transparent background) and not its content.
  if (event.target === helpModal) {
    closeModal(helpModal);
    // Remove the listener we added
    helpModal.removeEventListener("click", handleModalBackgroundClick);
  }
  if (event.target === calculatorModal) {
    closeModal(calculatorModal);
    // Remove the button listener when closing via background
    if (calculatorButtons) {
      calculatorButtons.removeEventListener(
        "click",
        handleCalculatorButtonClick
      );
    }
    // Remove the listener we added
    calculatorModal.removeEventListener("click", handleModalBackgroundClick);
  }
  // Note: Review modal close is handled differently (only via close button)
}

// --- Text Highlighting --- (Replaced with original logic)

// Original handleHighlightSelection
function handleHighlightSelection(event) {
  // Changed from no arg to event
  console.log("handleHighlightSelection called");

  // Debug information
  console.log("Event target:", event.target);
  console.log("Event currentTarget:", event.currentTarget);
  console.log("Question text element ID:", questionTextDiv.id);
  console.log("Question text element classes:", questionTextDiv.className);

  // Use event.currentTarget which IS the .question-text element the listener was attached to
  const questionTextElement = event.currentTarget;

  const selection = window.getSelection();
  // Exit if no selection or selection is empty (collapsed)
  if (!selection.rangeCount || selection.isCollapsed) {
    console.log("Highlight aborted: No selection range or selection collapsed");
    return;
  }

  const range = selection.getRangeAt(0);

  // Prevent highlighting if selection is zero width (e.g., just a click)
  if (range.getBoundingClientRect().width === 0) {
    console.log("Highlight aborted: Zero-width selection");
    selection.removeAllRanges(); // Clear the collapsed selection
    return;
  }

  // *** Add null check for the common ancestor container ***
  if (!range.commonAncestorContainer) {
    console.warn("Highlight aborted: Selection common ancestor is null.");
    selection.removeAllRanges();
    return;
  }

  // *** Add check if it's a valid Node ***
  if (!(range.commonAncestorContainer instanceof Node)) {
    console.warn(
      "Highlight aborted: Selection common ancestor is not a valid Node:",
      range.commonAncestorContainer
    );
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
    console.log(
      "Highlight aborted: Selection not contained within question text."
    ); // <-- Add Log
    selection.removeAllRanges(); // Clear selection if outside target area
    return;
  }

  // If all checks pass, apply the highlight
  console.log("Applying highlight..."); // <-- Add Log
  applyHighlight(range);
  // Selection is cleared within applyHighlight AFTER insertion
}

// Original applyHighlight
function applyHighlight(range) {
  // Create a span to wrap the selection
  const highlightSpan = document.createElement("span");
  highlightSpan.className = "highlighted-text"; // Use original class name

  // Add click listener to the span itself for removal
  highlightSpan.addEventListener("click", () => {
    console.log("Highlight span clicked! Attempting to remove..."); // <-- ADD THIS LOG
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

// Original removeHighlight
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

// Add the clearHighlights function (needed by renderQuestionUI)
function clearHighlights() {
  // Find all highlight spans and replace them with their text content
  const highlights = document.querySelectorAll("span.highlighted-text"); // Use original class name
  highlights.forEach((span) => {
    const parent = span.parentNode;
    if (parent) {
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
      // Normalize the parent node to merge adjacent text nodes
      parent.normalize();
    }
  });
}

// --- Question Rendering --- // Ensure listener attachment matches original
export function renderQuestionUI(
  questionData,
  currentIndex,
  totalQuestions,
  userAnswer,
  isMarked
) {
  if (!questionData) {
    if (questionTextDiv)
      questionTextDiv.innerHTML = "Error: Question data is missing.";
    if (optionsList) optionsList.innerHTML = "";
    return;
  }

  // Clear previous dynamic content
  if (optionsList) optionsList.innerHTML = "";
  if (feedbackDiv) {
    feedbackDiv.innerHTML = "";
    feedbackDiv.classList.add("hidden");
  }
  if (explanationDiv) {
    explanationDiv.innerHTML = "";
    explanationDiv.classList.add("hidden");
  }
  clearHighlights(); // Clear text highlights from previous question

  // Update header info (Question number/total)
  if (examSectionItemSpan) {
    examSectionItemSpan.textContent = `Question ${
      currentIndex + 1
    } of ${totalQuestions}`;
  }

  // Update question text (handle potential HTML)
  if (questionTextDiv) {
    questionTextDiv.innerHTML =
      questionData.text || questionData.question || "Question text not found.";
    // Re-attach highlight listener AFTER setting new content (Original approach)
    // Remove old listener first to prevent duplicates
    questionTextDiv.removeEventListener("mouseup", handleHighlightSelection);
    questionTextDiv.addEventListener("mouseup", handleHighlightSelection);
    console.log("Highlight listener attached to question text");
  }

  // Display image if path exists
  const imageContainer =
    document.getElementById("question-image-container") ||
    createDiv("question-image-container"); // Assuming an ID or create one
  if (questionData.image) {
    // Construct correct path assuming images are relative to 'questions and answers'
    imageContainer.innerHTML = `<img src="questions and answers/${questionData.image}" alt="Question image">`;
    // Ensure container is added to the DOM (e.g., after question text)
    if (
      questionTextDiv &&
      !document.getElementById("question-image-container")
    ) {
      questionTextDiv.parentNode.insertBefore(
        imageContainer,
        questionTextDiv.nextSibling
      );
    }
  } else {
    imageContainer.innerHTML = ""; // Clear image if none
  }

  // Render Options (Handle both array and object formats)
  const options = questionData.options;
  let optionLetterCode = 65; // ASCII for 'A'

  if (Array.isArray(options)) {
    // --- ARRAY FORMAT ---
    options.forEach((optionText, index) => {
      const optionLetter = String.fromCharCode(optionLetterCode + index);
      createOptionElement(
        optionLetter,
        optionText,
        index,
        currentIndex,
        userAnswer
      );
    });
  } else if (typeof options === "object" && options !== null) {
    // --- OBJECT FORMAT ---
    for (const optionLetter in options) {
      if (options.hasOwnProperty(optionLetter)) {
        const optionText = options[optionLetter];
        // Use the letter itself as the value for object format
        createOptionElement(
          optionLetter,
          optionText,
          optionLetter,
          currentIndex,
          userAnswer
        );
      }
    }
  } else {
    if (optionsList)
      optionsList.innerHTML = "<li>Error: Invalid options format.</li>";
  }

  // Set marked checkbox status
  if (markCheckbox) {
    markCheckbox.checked = !!isMarked; // Ensure boolean
  }

  // Re-apply strikethroughs for the current question if they exist
  applyStoredStrikethroughs(currentIndex);
}

// Helper to create a single option element
function createOptionElement(
  optionLetter,
  optionText,
  optionValue,
  questionIndex,
  userAnswer
) {
  if (!optionsList) return;
  const listItem = document.createElement("li");
  listItem.classList.add("option");
  // Use a data attribute for the option letter/value (consistent)
  listItem.dataset.option = optionLetter; // Or optionValue? Let's use Letter for display
  listItem.dataset.questionIndex = questionIndex; // Needed for event handlers

  const radioInput = document.createElement("input");
  radioInput.type = "radio";
  radioInput.name = `question_${questionIndex}`; // Unique name per question
  radioInput.value = optionValue; // Value to store ('A', 'B' or 0, 1)
  radioInput.id = `option_${questionIndex}_${optionLetter}`;

  const label = document.createElement("label");
  label.htmlFor = radioInput.id;
  // Display the letter before the text
  label.innerHTML = `<span>${optionLetter})</span> ${optionText}`; // Use innerHTML to render potential HTML in optionText

  listItem.appendChild(radioInput);
  listItem.appendChild(label);
  optionsList.appendChild(listItem);

  // Check if this option was the user's answer
  // Need careful comparison: userAnswer might be 'A', 'B' or '0', '1'
  let isSelected = false;
  if (userAnswer !== null && userAnswer !== undefined) {
    // If userAnswer is string digit '0', '1', compare to index (optionValue if array)
    // If userAnswer is letter 'A', 'B', compare to letter (optionValue if object)
    if (String(userAnswer) === String(optionValue)) {
      isSelected = true;
    }
  }

  if (isSelected) {
    radioInput.checked = true;
    listItem.classList.add("selected");
  }

  // --- Add Event Listeners for interaction ---
  // Left-click for selection
  listItem.addEventListener("click", handleOptionClick);
  // Right-click for strikethrough
  listItem.addEventListener("contextmenu", handleOptionRightClick);
}

// --- Strikethrough Application --- (Moved from renderer?)
// Needs access to `crossedOutOptions` from renderer state
let crossedOutOptionsRef = {}; // Initialize as empty object { questionIndex: Set() }

export function setStrikethroughReference(crossedOutOptions) {
  crossedOutOptionsRef = crossedOutOptions;
}

function applyStoredStrikethroughs(questionIndex) {
  if (!optionsList || !crossedOutOptionsRef[questionIndex]) return;

  const struckOptions = crossedOutOptionsRef[questionIndex]; // Should be a Set
  const optionElements = optionsList.querySelectorAll(".option");

  optionElements.forEach((optLi) => {
    const optionLetter = optLi.dataset.option;
    if (struckOptions.has(optionLetter)) {
      optLi.classList.add("crossed-out");
    } else {
      optLi.classList.remove("crossed-out"); // Ensure it's removed if not in Set
    }
  });
}

// Handle click and right-click need access to state (userAnswers, crossedOutOptions)
// These might be better placed in renderer.js or passed as callbacks
// Let's keep them here for now but ensure state is managed

function handleOptionClick(event) {
  const clickedOption = event.currentTarget;
  const questionIndex = parseInt(clickedOption.dataset.questionIndex);
  const optionValue = clickedOption.querySelector('input[type="radio"]').value;

  // Dispatch an event for the renderer to handle the state update
  const selectEvent = new CustomEvent("optionSelected", {
    detail: { questionIndex, selectedValue: optionValue },
    bubbles: true,
  });
  document.dispatchEvent(selectEvent);

  // Update UI immediately for responsiveness
  optionsList.querySelectorAll(".option").forEach((opt) => {
    if (parseInt(opt.dataset.questionIndex) === questionIndex) {
      opt.classList.remove("selected");
      opt.querySelector('input[type="radio"]').checked = false;
    }
  });
  clickedOption.classList.add("selected");
  clickedOption.querySelector('input[type="radio"]').checked = true;
}

function handleOptionRightClick(event) {
  event.preventDefault();
  const clickedOption = event.currentTarget;
  const questionIndex = parseInt(clickedOption.dataset.questionIndex);
  const optionLetter = clickedOption.dataset.option; // Use the letter for strikethrough tracking

  // Dispatch an event for the renderer to handle the state update
  const strikethroughEvent = new CustomEvent("optionStrikethroughToggled", {
    detail: { questionIndex, optionLetter },
    bubbles: true,
  });
  document.dispatchEvent(strikethroughEvent);

  // Update UI immediately
  // If it was selected, deselect it visually first
  if (clickedOption.classList.contains("selected")) {
    clickedOption.classList.remove("selected");
    clickedOption.querySelector('input[type="radio"]').checked = false;
    // Also dispatch selection clear event
    const selectEvent = new CustomEvent("optionSelected", {
      detail: { questionIndex, selectedValue: null }, // Signal clearing
      bubbles: true,
    });
    document.dispatchEvent(selectEvent);
  }

  clickedOption.classList.toggle("crossed-out");
}

// --- Navigation Buttons Update ---
export function updateNavigationButtons(currentIndex, totalQuestions) {
  if (prevButton) prevButton.disabled = currentIndex <= 0;
  // Disable next button on the last question? Or change text to "Finish"?
  // For now, let's disable it. Handling the finish action can be done in the event listener.
  if (nextButton) {
    // nextButton.disabled = currentIndex >= totalQuestions - 1;
    // Let's change text instead
    if (currentIndex >= totalQuestions - 1) {
      nextButton.textContent = "Finish Exam";
    } else {
      nextButton.textContent = "Next";
    }
    nextButton.disabled = false; // Keep it enabled to allow finishing
  }
}

// --- View Switching --- (Using hidden class)
export function showView(viewName) {
  console.log(`UI Controller: Switching view to ${viewName}`);
  // Hide all main containers first by adding 'hidden' class
  if (welcomeScreenDiv) welcomeScreenDiv.classList.add("hidden");
  if (appContainerDiv) appContainerDiv.classList.add("hidden");
  if (reportArea) reportArea.classList.add("hidden");

  // Show the requested container by removing 'hidden' class
  switch (viewName) {
    case "welcome":
      if (welcomeScreenDiv) welcomeScreenDiv.classList.remove("hidden");
      break;
    case "exam":
      if (appContainerDiv) {
        appContainerDiv.classList.remove("hidden");
        // ALSO remove the inline style that might be hiding it initially
        appContainerDiv.style.display = ""; // Set to empty string to remove inline style
      }
      // Ensure these are visible within the app container if needed
      if (headerElement) headerElement.classList.remove("hidden");
      if (mainWrapper) mainWrapper.classList.remove("hidden");
      if (footerElement) footerElement.classList.remove("hidden");
      break;
    case "report":
      if (reportArea) reportArea.classList.remove("hidden");
      break;
    default:
      console.error(`Unknown view name: ${viewName}`);
      // Show welcome screen as a fallback
      if (welcomeScreenDiv) welcomeScreenDiv.classList.remove("hidden");
      break;
  }
}

// --- Initialization (e.g., theme) ---
document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme(); // Apply theme as soon as DOM is ready

  // Ensure initial state for calculator display
  if (calculatorDisplay) calculatorDisplay.value = "0";
});

console.log("uiController.js loaded");

// Helper to create a div if it doesn't exist (Needed by renderQuestionUI)
function createDiv(id) {
  let div = document.getElementById(id);
  if (!div) {
    div = document.createElement("div");
    div.id = id;
    // Note: This function only creates the div,
    // renderQuestionUI is responsible for adding it to the DOM if needed.
  }
  return div;
}
