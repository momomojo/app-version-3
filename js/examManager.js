// --- Exam Management Logic ---

/**
 * Loads question data from a specified JSON file within the 'questions and answers' directory.
 * @param {string} filename - The name of the JSON file (e.g., 'Neuro-E-5.json').
 * @returns {Promise<Array>} A promise that resolves with the array of questions.
 * @throws {Error} If fetching or parsing fails.
 */
export async function loadQuestions(filename) {
    console.log(`ExamManager: Loading questions from ${filename}...`);
    if (!filename) {
        throw new Error("loadQuestions requires a filename.");
    }

    const filePath = `questions and answers/${filename}`; // Corrected path

    try {
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`Failed to load ${response.url}: ${response.status} ${response.statusText}`);
        }
        
        const questionsData = await response.json();
        
        if (!Array.isArray(questionsData)) {
             throw new Error(`Invalid format: ${filename} did not contain a JSON array.`);
        }
        
        console.log(`ExamManager: Successfully loaded ${questionsData.length} questions from ${filename}.`);
        return questionsData; // Return the parsed questions array

    } catch (error) {
        console.error(`Error loading questions from ${filename}:`, error);
        // Re-throw the error so the caller can handle it (e.g., display UI message)
        throw error; 
    }
}
