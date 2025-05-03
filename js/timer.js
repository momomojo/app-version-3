// --- Timer Variables ---
let timerInterval = null;
const totalExamSeconds = 150 * 90; // 150 questions * 90 seconds/question
let timeRemainingSeconds = totalExamSeconds;
let isTimerPaused = false;

// Reference needed DOM elements (ensure these exist in the HTML)
const timeRemainingSpan = document.getElementById('time-remaining');
const pauseButton = document.getElementById('pause-button');

// Timer Functions
function updateTimerDisplay() {
    // Ensure the span exists before trying to update it
    if (!timeRemainingSpan) {
        console.error("Timer display span ('time-remaining') not found!");
        return;
    }
    const hours = Math.floor(timeRemainingSeconds / 3600);
    const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
    const seconds = timeRemainingSeconds % 60;
    timeRemainingSpan.textContent = `Time Remaining: ${hours} hr ${minutes.toString().padStart(2, '0')} min ${seconds.toString().padStart(2, '0')} sec`;

    if (timeRemainingSeconds <= 0) {
        // We need access to endExam() which is in renderer.js
        // This will be handled later via imports/exports or a global event bus
        if (typeof endExam === 'function') {
            endExam(); 
        } else {
            console.warn("endExam function not accessible from timer.js");
            // As a fallback, just stop the timer
            clearInterval(timerInterval);
        }
    }
}

/**
 * Starts the countdown timer.
 * @param {number} totalSeconds - The total duration for the timer in seconds.
 */
function startTimer(totalSeconds) {
    if (typeof totalSeconds !== 'number' || totalSeconds <= 0) {
        console.error("Timer Error: startTimer requires a positive number of totalSeconds.");
        return; // Don't start if invalid duration
    }

    console.log(`Timer: Starting with ${totalSeconds} seconds.`);
    timeRemainingSeconds = totalSeconds; // Initialize the time
    if (timerInterval) clearInterval(timerInterval); // Prevent multiple intervals
    // Update display immediately before starting interval
    updateTimerDisplay(); 
    timerInterval = setInterval(() => {
        if (!isTimerPaused) {
            timeRemainingSeconds--;
            if (timeRemainingSeconds < 0) timeRemainingSeconds = 0; // Prevent negative time
            updateTimerDisplay();
        }
    }, 1000);
}

function togglePause() {
    // Ensure the button exists
    if (!pauseButton) {
        console.error("Pause button ('pause-button') not found!");
        return;
    }
    if (isTimerPaused) {
        // Resume
        startTimer(timeRemainingSeconds); // Restart interval
        isTimerPaused = false;
        pauseButton.textContent = 'Pause';
        pauseButton.classList.remove('paused'); // Optional: remove paused style
        console.log("Timer Resumed");
    } else {
        // Pause
        clearInterval(timerInterval); // Stop interval
        isTimerPaused = true;
        pauseButton.textContent = 'Resume';
        pauseButton.classList.add('paused'); // Optional: add paused style
        console.log("Timer Paused");
    }
}

// Note: We might need to export these functions if using modules later
// export { startTimer, togglePause, updateTimerDisplay, timeRemainingSeconds, totalExamSeconds, isTimerPaused };
