// --- Timer Variables ---
let timerInterval = null;
let totalExamSeconds = 150 * 90; // 150 questions * 90 seconds/question - Default, can be overridden
let timeRemainingSeconds = totalExamSeconds;
let isTimerPaused = false;

// Reference needed DOM elements (ensure these exist in the HTML)
const timeRemainingSpan = document.getElementById("time-remaining");
const pauseButton = document.getElementById("pause-button");

// Timer Functions
function updateTimerDisplay() {
  // Ensure the span exists before trying to update it
  if (!timeRemainingSpan) {
    console.error("Timer display span ('time-remaining') not found!");
    clearInterval(timerInterval); // Stop the timer if display is missing
    return;
  }
  const hours = Math.floor(timeRemainingSeconds / 3600);
  const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
  const seconds = timeRemainingSeconds % 60;
  timeRemainingSpan.textContent = `Time Remaining: ${hours} hr ${minutes
    .toString()
    .padStart(2, "0")} min ${seconds.toString().padStart(2, "0")} sec`;

  if (timeRemainingSeconds <= 0) {
    console.log("Timer: Time has run out. Dispatching timerEnd event.");
    clearInterval(timerInterval); // Stop the timer
    // Dispatch a custom event for the renderer process to catch
    const timerEndEvent = new CustomEvent("timerEnd", { bubbles: true });
    document.dispatchEvent(timerEndEvent);
    // Remove the direct call to endExam()
    // if (typeof endExam === 'function') {
    //     endExam();
    // } else {
    //     console.warn("endExam function not accessible from timer.js");
    // }
  }
}

/**
 * Starts the countdown timer.
 * @param {number} initialSeconds - The initial duration for the timer in seconds.
 */
export function startTimer(initialSeconds) {
  // Allow overriding the default total time
  if (typeof initialSeconds === "number" && initialSeconds > 0) {
    totalExamSeconds = initialSeconds;
    timeRemainingSeconds = initialSeconds;
  } else {
    timeRemainingSeconds = totalExamSeconds; // Use default if no valid override
    console.warn(
      `Timer: Invalid or no initialSeconds provided. Using default: ${totalExamSeconds}s`
    );
  }

  console.log(`Timer: Starting with ${timeRemainingSeconds} seconds.`);
  isTimerPaused = false; // Ensure timer is not paused when starting/restarting
  if (pauseButton) {
    pauseButton.textContent = "Pause";
    pauseButton.classList.remove("paused");
  }

  if (timerInterval) clearInterval(timerInterval); // Prevent multiple intervals

  updateTimerDisplay(); // Update display immediately

  timerInterval = setInterval(() => {
    if (!isTimerPaused) {
      timeRemainingSeconds--;
      if (timeRemainingSeconds < 0) timeRemainingSeconds = 0; // Prevent negative time
      updateTimerDisplay();
    }
  }, 1000);
}

export function stopTimer() {
  console.log("Timer: Stopping timer interval.");
  clearInterval(timerInterval);
  timerInterval = null; // Clear the interval ID
}

export function togglePause() {
  if (!pauseButton) {
    console.error("Pause button ('pause-button') not found!");
    return;
  }
  // Prevent pausing if timer is not running (already ended or stopped)
  if (timeRemainingSeconds <= 0 && !isTimerPaused) return;

  if (isTimerPaused) {
    // Resume
    isTimerPaused = false;
    pauseButton.textContent = "Pause";
    pauseButton.classList.remove("paused"); // Optional: remove paused style
    console.log("Timer Resumed");
    // No need to call startTimer here, the interval continues if it exists
  } else {
    // Pause
    isTimerPaused = true;
    pauseButton.textContent = "Resume";
    pauseButton.classList.add("paused"); // Optional: add paused style
    console.log("Timer Paused");
    // The interval itself keeps running, but the timeRemainingSeconds stops decrementing
    // clearInterval(timerInterval); // Don't clear, just pause decrementing
  }
}

// Add listener for the pause button when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (pauseButton) {
    pauseButton.addEventListener("click", togglePause);
    console.log("Timer: Pause button listener attached.");
  } else {
    console.warn("Timer: Pause button not found during DOMContentLoaded.");
  }
});

// Expose only necessary functions
// export { startTimer, togglePause, stopTimer }; // We are already exporting individually
