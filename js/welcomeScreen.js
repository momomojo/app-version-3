import { initializeExam } from "./renderer.js";
import { showView } from "./uiController.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("WelcomeScreen: DOMContentLoaded");

  const welcomeScreenDiv = document.getElementById("welcome-screen");
  const appContainerDiv = document.getElementById("app-container");
  const examCheckboxesContainer = document.getElementById("exam-checkboxes");
  const startExamBtn = document.getElementById("start-exam-btn");
  const loadingMessage = document.getElementById("loading-message");
  const examSummary = document.getElementById("exam-summary");
  const uploadFilesBtn = document.getElementById("upload-files-btn");
  const selectDirectoryBtn = document.getElementById("select-directory-btn");

  if (
    !welcomeScreenDiv ||
    !appContainerDiv ||
    !examCheckboxesContainer ||
    !startExamBtn ||
    !loadingMessage ||
    !examSummary ||
    !uploadFilesBtn ||
    !selectDirectoryBtn
  ) {
    console.error("WelcomeScreen: Required HTML elements not found!");
    return;
  }

  // Show warning modal
  const warningModal = document.getElementById("warning-modal");
  const closeWarningButton = document.getElementById("close-warning-modal");

  if (warningModal && closeWarningButton) {
    // Display the warning modal
    warningModal.style.display = "flex";

    // Add event listener to close button
    closeWarningButton.addEventListener("click", () => {
      warningModal.style.display = "none";
    });

    // Also close when clicking outside the modal content
    warningModal.addEventListener("click", (event) => {
      if (event.target === warningModal) {
        warningModal.style.display = "none";
      }
    });

    console.log("WelcomeScreen: Warning modal displayed");
  } else {
    console.error("WelcomeScreen: Warning modal elements not found");
  }

  // Track selected files and question counts
  let selectedExamFiles = [];
  let totalSelectedQuestions = 0;

  // Set to keep track of all loaded files (default + user-uploaded)
  // This helps avoid duplicate entries
  const loadedFiles = new Set();

  // --- Functions ---
  async function populateExamList() {
    console.log("WelcomeScreen: Populating exam list...");
    loadingMessage.textContent = "Loading available exams...";
    startExamBtn.disabled = true;
    examSummary.textContent = "";

    try {
      // Check if electronAPI is exposed
      if (
        !window.electronAPI ||
        typeof window.electronAPI.getExamList !== "function"
      ) {
        throw new Error(
          "electronAPI or getExamList function is not available. Is preload.js correctly configured?"
        );
      }

      const examFiles = await window.electronAPI.getExamList();
      console.log("WelcomeScreen: Received exam files:", examFiles);

      examCheckboxesContainer.innerHTML = ""; // Clear existing checkboxes

      if (examFiles.length === 0) {
        loadingMessage.textContent =
          "No exam files found in questions_and_answers directory.";
        console.warn(
          "WelcomeScreen: No exam files returned from main process."
        );
      } else {
        // For each exam file, create a checkbox
        examFiles.forEach((filename) => {
          addExamFileCheckbox(filename);
          loadedFiles.add(filename); // Track this file as loaded
        });

        loadingMessage.textContent = ""; // Clear loading message
      }
    } catch (error) {
      console.error(
        "WelcomeScreen: Error fetching or populating exam list:",
        error
      );
      loadingMessage.textContent = `Error loading exams: ${error.message}`;
      examCheckboxesContainer.innerHTML = "<div>Error loading exam files</div>";
    }
  }

  // Creates and adds a checkbox for an exam file
  function addExamFileCheckbox(filename) {
    // Skip if this file is already in the list
    if (document.getElementById(`exam-${filename}`)) {
      return;
    }

    const checkboxItem = document.createElement("div");
    checkboxItem.className = "exam-checkbox-item";
    checkboxItem.dataset.filename = filename;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `exam-${filename}`;
    checkbox.value = filename;
    checkbox.dataset.filename = filename;

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = filename.replace(".json", ""); // Display cleaner name

    // Create delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-exam-btn";
    deleteBtn.innerHTML = "×"; // Use × character as the X
    deleteBtn.title = "Remove this exam file";
    deleteBtn.dataset.filename = filename;
    deleteBtn.addEventListener("click", handleDeleteExam);

    // Add the question count if available (can be updated later)
    const questionCount = document.createElement("span");
    questionCount.className = "question-count";
    questionCount.id = `count-${filename}`;

    // Try to fetch question count
    getQuestionCount(filename).then((count) => {
      questionCount.textContent = count ? ` (${count} questions)` : "";
      checkbox.dataset.questionCount = count || 0;
    });

    label.appendChild(questionCount);
    checkboxItem.appendChild(checkbox);
    checkboxItem.appendChild(label);
    checkboxItem.appendChild(deleteBtn);
    examCheckboxesContainer.appendChild(checkboxItem);

    // Add change listener to update selected files
    checkbox.addEventListener("change", handleExamSelectionChange);
  }

  // Function to get question count from file
  async function getQuestionCount(filename) {
    try {
      // If electronAPI has a method to get question count, use it
      if (
        window.electronAPI &&
        typeof window.electronAPI.getQuestionCount === "function"
      ) {
        return await window.electronAPI.getQuestionCount(filename);
      }

      // For uploaded files or when using fetch
      let filePath;

      // If the file starts with an absolute path or a non-standard path (uploaded by user)
      if (
        filename.startsWith("/") ||
        filename.startsWith("\\") ||
        filename.includes(":")
      ) {
        filePath = filename;
      } else {
        // Standard path in questions directory
        filePath = `questions and answers/${filename}`;
      }

      // Alternative approach - load the file and count questions
      const response = await fetch(filePath);
      if (!response.ok) return 0;
      const data = await response.json();
      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      console.error(`Error getting question count for ${filename}:`, error);
      return 0;
    }
  }

  // Handler for exam selection changes
  function handleExamSelectionChange(event) {
    const checkbox = event.target;
    const filename = checkbox.dataset.filename;
    const questionCount = parseInt(checkbox.dataset.questionCount) || 0;

    if (checkbox.checked) {
      // Add to selected files
      if (!selectedExamFiles.includes(filename)) {
        selectedExamFiles.push(filename);
        totalSelectedQuestions += questionCount;
      }
    } else {
      // Remove from selected files
      const index = selectedExamFiles.indexOf(filename);
      if (index !== -1) {
        selectedExamFiles.splice(index, 1);
        totalSelectedQuestions -= questionCount;
      }
    }

    // Update the summary and button state
    updateExamSummary();
  }

  // Update exam summary and start button state
  function updateExamSummary() {
    startExamBtn.disabled = selectedExamFiles.length === 0;

    if (selectedExamFiles.length === 0) {
      examSummary.textContent = "";
    } else {
      const fileText = selectedExamFiles.length === 1 ? "file" : "files";
      examSummary.textContent = `Selected ${selectedExamFiles.length} ${fileText} with ${totalSelectedQuestions} questions total`;
    }
  }

  // Upload JSON files handler
  async function handleUploadFiles() {
    if (
      !window.electronAPI ||
      typeof window.electronAPI.openFileDialog !== "function"
    ) {
      alert("File upload functionality is not available");
      return;
    }

    try {
      loadingMessage.textContent = "Selecting files...";

      // Open file dialog and get selected file paths
      const files = await window.electronAPI.openFileDialog({
        title: "Select JSON Files",
        buttonLabel: "Add Files",
        filters: [{ name: "JSON Files", extensions: ["json"] }],
        properties: ["openFile", "multiSelections"],
      });

      if (!files || files.length === 0) {
        loadingMessage.textContent = "";
        return;
      }

      loadingMessage.textContent = `Processing ${files.length} files...`;

      // Add each selected file to the list
      for (const filePath of files) {
        // Extract the filename from the path (keeping full path for loading)
        const filename = filePath.split(/[/\\]/).pop();

        if (!loadedFiles.has(filePath)) {
          loadedFiles.add(filePath);
          addExamFileCheckbox(filePath);
        }
      }

      loadingMessage.textContent = `Added ${files.length} file(s)`;
      setTimeout(() => {
        loadingMessage.textContent = "";
      }, 3000);
    } catch (error) {
      console.error("Error uploading files:", error);
      loadingMessage.textContent = `Error: ${error.message}`;
    }
  }

  // Select directory handler
  async function handleSelectDirectory() {
    if (
      !window.electronAPI ||
      typeof window.electronAPI.openDirectoryDialog !== "function"
    ) {
      alert("Directory selection functionality is not available");
      return;
    }

    try {
      loadingMessage.textContent = "Selecting directory...";

      // Open directory dialog and get selected path
      const dirPath = await window.electronAPI.openDirectoryDialog({
        title: "Select Directory with JSON Files",
        buttonLabel: "Select Directory",
      });

      if (!dirPath) {
        loadingMessage.textContent = "";
        return;
      }

      loadingMessage.textContent = "Scanning directory for JSON files...";

      // Get JSON files from the directory
      const files = await window.electronAPI.getJSONFilesFromDirectory(dirPath);

      if (!files || files.length === 0) {
        loadingMessage.textContent =
          "No JSON files found in the selected directory";
        setTimeout(() => {
          loadingMessage.textContent = "";
        }, 3000);
        return;
      }

      loadingMessage.textContent = `Processing ${files.length} files...`;

      // Add each file to the list
      for (const filePath of files) {
        if (!loadedFiles.has(filePath)) {
          loadedFiles.add(filePath);
          addExamFileCheckbox(filePath);
        }
      }

      loadingMessage.textContent = `Added ${files.length} file(s) from directory`;
      setTimeout(() => {
        loadingMessage.textContent = "";
      }, 3000);
    } catch (error) {
      console.error("Error selecting directory:", error);
      loadingMessage.textContent = `Error: ${error.message}`;
    }
  }

  // Function to handle exam deletion
  function handleDeleteExam(event) {
    event.preventDefault();
    event.stopPropagation();

    const deleteBtn = event.currentTarget;
    const filename = deleteBtn.dataset.filename;
    const checkboxItem = deleteBtn.closest(".exam-checkbox-item");

    if (!checkboxItem || !filename) return;

    console.log(`WelcomeScreen: Removing exam file ${filename}`);

    // If this file was selected, remove it from selectedExamFiles array
    const index = selectedExamFiles.indexOf(filename);
    if (index !== -1) {
      const questionCount =
        parseInt(
          checkboxItem.querySelector('input[type="checkbox"]').dataset
            .questionCount
        ) || 0;
      selectedExamFiles.splice(index, 1);
      totalSelectedQuestions -= questionCount;
      updateExamSummary();
    }

    // Remove from loaded files set
    loadedFiles.delete(filename);

    // Remove the checkbox item from the DOM
    checkboxItem.remove();

    // Show feedback
    loadingMessage.textContent = `Removed ${filename}`;
    setTimeout(() => {
      loadingMessage.textContent = "";
    }, 2000);
  }

  // Move Format Guide initialization to a separate function for reliability
  function initFormatGuide() {
    console.log("WelcomeScreen: Initializing Format Guide...");

    // Get DOM elements
    const formatGuideBtn = document.getElementById("format-guide-btn");
    const formatGuideModal = document.getElementById("format-guide-modal");
    const closeFormatGuideButton = document.getElementById(
      "close-format-guide-modal"
    );
    const formatTabButtons = document.querySelectorAll(".format-tab-btn");

    // Log the elements to help debug
    console.log("Format Guide Button:", formatGuideBtn);
    console.log("Format Guide Modal:", formatGuideModal);
    console.log("Close Format Guide Button:", closeFormatGuideButton);
    console.log("Format Tab Buttons:", formatTabButtons.length);

    if (!formatGuideBtn) {
      console.error("Format Guide Button not found in the DOM!");
      return;
    }

    if (!formatGuideModal) {
      console.error("Format Guide Modal not found in the DOM!");
      return;
    }

    // Open format guide when button is clicked
    formatGuideBtn.addEventListener("click", () => {
      console.log("Format Guide Button clicked!");
      // Set display flex to ensure it appears correctly
      formatGuideModal.style.display = "flex";
      // Remove the hidden class after a short delay
      setTimeout(() => {
        formatGuideModal.classList.remove("hidden");
      }, 10);
    });

    if (closeFormatGuideButton) {
      // Close when X button is clicked
      closeFormatGuideButton.addEventListener("click", () => {
        console.log("Closing Format Guide Modal");
        // Add the hidden class
        formatGuideModal.classList.add("hidden");
        // Set display to none after a short delay to allow the transition
        setTimeout(() => {
          formatGuideModal.style.display = "none";
        }, 300);
      });
    } else {
      console.error("Close Format Guide Button not found!");
    }

    // Close when clicking outside the modal content
    formatGuideModal.addEventListener("click", (event) => {
      if (event.target === formatGuideModal) {
        // Add the hidden class
        formatGuideModal.classList.add("hidden");
        // Set display to none after a short delay
        setTimeout(() => {
          formatGuideModal.style.display = "none";
        }, 300);
      }
    });

    // Make sure the Examples tab content exists
    const examplesTab = document.getElementById("examples-tab");
    if (!examplesTab) {
      // Create the examples tab if it doesn't exist
      const examplesContent = document.createElement("div");
      examplesContent.id = "examples-tab";
      examplesContent.className = "format-tab-content";

      // Get the parent container
      const parent = document.querySelector(".format-guide-content");
      if (parent) {
        // Add after other tabs
        parent.appendChild(examplesContent);

        // Copy content from the examples in the advanced tab if available
        const advancedTab = document.getElementById("advanced-tab");
        if (advancedTab) {
          const exampleSection = advancedTab.querySelector(
            "h3:contains('Example')"
          );
          if (exampleSection) {
            // Clone example section to examples tab
            const clonedContent = exampleSection.parentNode.cloneNode(true);
            examplesContent.appendChild(clonedContent);
          } else {
            // Fallback content
            examplesContent.innerHTML = `
              <h3>Complete Example</h3>
              <pre class="code-example">
[
  {
    "text": "A 45-year-old man presents with fever... Which of the following is the most likely diagnosis?",
    "options": {
      "A": "Herpes simplex encephalitis",
      "B": "Lyme disease",
      "C": "Neurosarcoidosis",
      "D": "Neurosyphilis", 
      "E": "Tuberculous meningitis"
    },
    "correctAnswer": "B",
    "explanation": "The clinical presentation and CSF findings are consistent with Lyme disease..."
  }
]</pre>
            `;
          }
        }
      }
    }

    // Tab switching functionality
    if (formatTabButtons.length > 0) {
      formatTabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          console.log("Tab button clicked:", button.dataset.tab);

          // Remove active class from all buttons and content
          formatTabButtons.forEach((btn) => btn.classList.remove("active"));
          document
            .querySelectorAll(".format-tab-content")
            .forEach((content) => {
              content.classList.remove("active");
            });

          // Add active class to clicked button and corresponding content
          button.classList.add("active");
          const tabName = button.dataset.tab;
          const tabContent = document.getElementById(`${tabName}-tab`);

          if (tabContent) {
            tabContent.classList.add("active");
          } else {
            console.error(`Tab content not found for: ${tabName}-tab`);
          }
        });
      });

      // Ensure first tab is active by default
      if (!document.querySelector(".format-tab-btn.active")) {
        formatTabButtons[0].classList.add("active");
        const firstTabName = formatTabButtons[0].dataset.tab;
        const firstTabContent = document.getElementById(`${firstTabName}-tab`);
        if (firstTabContent) {
          firstTabContent.classList.add("active");
        }
      }
    } else {
      console.error("No format tab buttons found!");
    }

    console.log("WelcomeScreen: Format guide initialization complete");
  }

  // --- Event Listeners ---
  startExamBtn.addEventListener("click", () => {
    if (selectedExamFiles.length === 0) {
      alert("Please select at least one exam file.");
      return;
    }

    console.log(
      `WelcomeScreen: Starting exam with ${selectedExamFiles.length} files:`,
      selectedExamFiles
    );

    // Hide welcome screen and show main app
    showView("exam");

    // Call the initialization function with the array of selected files
    initializeExam(selectedExamFiles);
  });

  // Add listeners for file upload and directory selection
  uploadFilesBtn.addEventListener("click", handleUploadFiles);
  selectDirectoryBtn.addEventListener("click", handleSelectDirectory);

  // --- Initialization ---
  populateExamList();

  // Initialize format guide separately after everything else
  setTimeout(() => {
    initFormatGuide();
  }, 500); // Small delay to ensure DOM is fully rendered
});

console.log("welcomeScreen.js loaded");
