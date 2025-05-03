// --- Report Generation Logic ---

// Helper to format text (e.g., replace newlines with <br>)
function formatText(text) {
    if (!text) return '';
    // Replace both \n and \r\n with <br>
    return text.replace(/\r?\n/g, '<br>');
}

// Generates the HTML for the report and inserts it into the provided element
// scoreData should be an object like { correctCount: X, totalQuestions: Y }
export function generateReport(reportElement, questions, userAnswers, scoreData) {
    console.log("Report Generator: Generating report...");
    if (!reportElement) {
        console.error("generateReport: reportElement is missing!");
        return;
    }
    if (!questions || !userAnswers || !scoreData) {
         console.error("generateReport: Missing required data (questions, userAnswers, or scoreData).");
         reportElement.innerHTML = '<p style="color: red;">Error generating report: Missing data.</p>';
         return;
    }

    let reportHtml = '';

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[index]; // User's stored answer ('A', 'B', or '0', '1', etc.)
        const correctAnswer = question.answer; // Correct answer from JSON ('A', 'B', or 0, 1, etc.)
        const options = question.options;

        let userAnswerText = 'Not answered';
        let correctAnswerText = 'N/A';
        let isCorrect = false;

        // Check if options exist before proceeding
        if (options) {
            // Determine format and generate text accordingly
            if (Array.isArray(options)) {
                // --- ARRAY FORMAT --- 
                const userAnswerIndex = userAnswer !== null ? parseInt(userAnswer, 10) : -1;
                const correctAnswerIndex = correctAnswer !== null ? parseInt(correctAnswer, 10) : -1;

                const isValidUserAnswer = userAnswer !== null && !isNaN(userAnswerIndex) && userAnswerIndex >= 0 && userAnswerIndex < options.length;
                const isValidCorrectAnswer = correctAnswer !== null && !isNaN(correctAnswerIndex) && correctAnswerIndex >= 0 && correctAnswerIndex < options.length;

                userAnswerText = isValidUserAnswer
                    ? `${String.fromCharCode(65 + userAnswerIndex)}) ${formatText(options[userAnswerIndex])}`
                    : (userAnswer === null ? 'Not answered' : 'Invalid Answer');
                
                correctAnswerText = isValidCorrectAnswer
                    ? `${String.fromCharCode(65 + correctAnswerIndex)}) ${formatText(options[correctAnswerIndex])}`
                    : 'N/A';

                // Comparison for array format (userAnswer is string index, correctAnswer is number index)
                isCorrect = isValidUserAnswer && isValidCorrectAnswer && userAnswer == correctAnswerIndex; // Use loose equality for type coercion

            } else if (typeof options === 'object' && options !== null) {
                // --- OBJECT FORMAT --- (e.g., Neuro-E-5.json)
                const isValidUserAnswer = userAnswer !== null && options.hasOwnProperty(userAnswer);
                const isValidCorrectAnswer = correctAnswer !== null && options.hasOwnProperty(correctAnswer);

                 userAnswerText = isValidUserAnswer
                    ? `${userAnswer}) ${formatText(options[userAnswer])}`
                    : (userAnswer === null ? 'Not answered' : 'Invalid Answer');

                correctAnswerText = isValidCorrectAnswer
                    ? `${correctAnswer}) ${formatText(options[correctAnswer])}`
                    : 'N/A';

                // Comparison for object format (both userAnswer and correctAnswer are keys like 'A')
                isCorrect = isValidUserAnswer && isValidCorrectAnswer && userAnswer === correctAnswer; // Strict equality works here
            } else {
                 console.warn(`Question ${index}: Invalid options format encountered.`, options);
                 userAnswerText = 'Invalid Options';
                 correctAnswerText = 'Invalid Options';
            }
        } else {
            console.warn(`Question ${index}: No options found.`);
            userAnswerText = userAnswer === null ? 'Not answered' : 'Invalid Answer (No Options)';
            correctAnswerText = 'N/A (No Options)';
            isCorrect = false; // Cannot be correct if there are no options
        }
        
        reportHtml += `
            <div class="report-item ${isCorrect ? 'correct' : 'incorrect'}"> 
                <h4>Question ${index + 1} ${isCorrect ? '<span class="status-correct">✓</span>' : '<span class="status-incorrect">✗</span>'}</h4>
                <div class="report-question-text">${formatText(question.text || question.question)}</div> // Use 'text' or fallback to 'question'
                ${question.imagePath ? `<div class="report-question-image"><img src="questions and answers/${question.imagePath}" alt="Question image"></div>` : ''}
                <p><strong>Your Answer:</strong> ${userAnswerText}</p>
                <p><strong>Correct Answer:</strong> ${correctAnswerText}</p>
                ${question.explanation ? `<div class="report-explanation"><p><strong>Explanation:</strong> ${formatText(question.explanation)}</p></div>` : '<div class="report-explanation"><p><strong>Explanation:</strong> Not available.</p></div>'}
            </div>
            <hr>
        `;
    });

    // Prepend the score summary
    reportHtml = `
        <div class="report-summary">
            <h3>Exam Report</h3>
            <p>Score: ${scoreData.correctCount} out of ${scoreData.totalQuestions} (${((scoreData.correctCount / scoreData.totalQuestions) * 100).toFixed(1)}%)</p>
        </div>
        <hr>
        ${reportHtml}
    `;

    reportElement.innerHTML = reportHtml;
    console.log("Report Generator: Report generation complete.");
}
