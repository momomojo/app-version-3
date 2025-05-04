// --- Report Generation Logic ---

// Helper to format text (e.g., replace newlines with <br>)
function formatText(text) {
  // Add check for string type
  if (typeof text !== "string") {
    return text || ""; // Return original value or empty string if null/undefined/etc.
  }
  // Replace both \n and \r\n with <br>
  return text.replace(/\r?\n/g, "<br>");
}

// Generates the HTML for the report and inserts it into the provided element
// scoreData should be an object like { correctCount: X, totalQuestions: Y }
export function generateReport(
  reportElement,
  questions,
  userAnswers,
  scoreData,
  markedQuestions = []
) {
  console.log("Report Generator: Generating report...");
  if (!reportElement) {
    console.error("generateReport: reportElement is missing!");
    return;
  }
  if (!questions || !userAnswers || !scoreData) {
    console.error(
      "generateReport: Missing required data (questions, userAnswers, or scoreData)."
    );
    reportElement.innerHTML =
      '<p style="color: red;">Error generating report: Missing data.</p>';
    return;
  }

  let reportHtml = "";

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index]; // User's stored answer ('A', 'B', or '0', '1', etc.)
    const correctAnswer = question.correctAnswer; // USE CORRECT FIELD NAME from JSON
    const options = question.options;
    const isMarked = markedQuestions[index] === true;

    // --- REMOVE DEBUG LOG (can be re-added if needed) ---
    /* console.log(
      `Report Q${
        index + 1
      }: Correct Key = '${correctAnswer}', Options Type = ${typeof options}, Options Has Key? = ${
        options ? options.hasOwnProperty(correctAnswer) : "N/A"
      }`
    ); */
    // --- END DEBUG LOG ---

    let userAnswerText = "Not answered";
    let correctAnswerText = "N/A";
    let isCorrect = false;

    // Check if options exist before proceeding
    // Simplify logic assuming consistent OBJECT format like original
    if (
      typeof options === "object" &&
      options !== null &&
      !Array.isArray(options)
    ) {
      const isValidUserAnswer =
        userAnswer !== null && options.hasOwnProperty(userAnswer);
      const isValidCorrectAnswer =
        correctAnswer !== null && options.hasOwnProperty(correctAnswer);

      userAnswerText = isValidUserAnswer
        ? `${userAnswer}) ${formatText(options[userAnswer])}`
        : userAnswer === null
        ? "Not answered"
        : "Invalid Answer";

      correctAnswerText = isValidCorrectAnswer
        ? `${correctAnswer}) ${formatText(options[correctAnswer])}`
        : "N/A (Invalid Correct Answer Key)";

      // Comparison for object format
      isCorrect =
        isValidUserAnswer &&
        isValidCorrectAnswer &&
        userAnswer === correctAnswer;
    } else {
      console.warn(
        `Question ${index}: Invalid or missing options object encountered.`,
        options
      );
      userAnswerText = "Invalid Options Format";
      correctAnswerText = "Invalid Options Format";
      isCorrect = false;
    }

    // Create status indicators
    const correctnessIndicator = isCorrect
      ? '<span class="status-correct">✓</span>'
      : '<span class="status-incorrect">✗</span>';

    const markedIndicator = isMarked
      ? '<span class="status-marked" title="This question was marked during the exam">Marked</span>'
      : "";

    reportHtml += `
        <div class="report-item ${isCorrect ? "correct" : "incorrect"} ${
      isMarked ? "marked-question" : ""
    }">
            <h4>
              Question ${index + 1} 
              ${correctnessIndicator}
              ${markedIndicator}
            </h4>
            <div class="report-question-text">${formatText(
              question.text || question.question
            )}</div>
            ${
              question.image
                ? `<div class="report-question-image"><img src="questions and answers/${question.image}" alt="Question image"></div>`
                : ""
            }
            <p><strong>Your Answer:</strong> <span class="${
              isCorrect ? "correct-answer" : "incorrect-answer"
            }">${userAnswerText}</span></p>
            <p><strong>Correct Answer:</strong> <span class="correct-answer">${correctAnswerText}</span></p>
            ${
              question.explanation
                ? `<div class="report-explanation">
                    ${
                      question.explanation.correct
                        ? `<p><strong>Rationale (Correct):</strong> ${formatText(
                            question.explanation.correct
                          )}</p>`
                        : ""
                    }
                    ${
                      question.explanation.incorrect
                        ? `<p><strong>Rationale (Incorrect):</strong> ${formatText(
                            question.explanation.incorrect
                          )}</p>`
                        : ""
                    }
                    ${
                      question.explanation.educationalObjective
                        ? `<p><strong>Educational Objective:</strong> ${formatText(
                            question.explanation.educationalObjective
                          )}</p>`
                        : ""
                    }
                    ${
                      !question.explanation.correct &&
                      !question.explanation.incorrect &&
                      !question.explanation.educationalObjective
                        ? `<p><strong>Explanation:</strong> ${formatText(
                            question.explanation
                          )}</p>`
                        : ""
                    } <!-- Fallback if specific keys missing -->
                 </div>`
                : '<div class="report-explanation"><p><strong>Explanation:</strong> Not available.</p></div>'
            }
        </div>
        <hr>
    `;
  });

  // Count marked questions for summary
  const markedCount = markedQuestions.filter(Boolean).length;

  // Prepend the score summary
  reportHtml = `
        <div class="report-summary">
            <h3>Exam Report</h3>
            <p>
              Score: ${scoreData.correctCount} out of ${
    scoreData.totalQuestions
  } 
              (${(
                (scoreData.correctCount / scoreData.totalQuestions) *
                100
              ).toFixed(1)}%)
              ${
                markedCount > 0
                  ? `<br>Questions marked during exam: ${markedCount}`
                  : ""
              }
            </p>
        </div>
        <hr>
        ${reportHtml}
    `;

  reportElement.innerHTML = reportHtml;
  console.log("Report Generator: Report generation complete.");
}
