// --- Exam Management Logic ---

/**
 * Loads question data from one or more JSON files within the 'questions and answers' directory.
 * @param {string|string[]} filenames - A single filename or array of filenames to load.
 * @returns {Promise<Array>} A promise that resolves with the combined array of questions from all files.
 * @throws {Error} If fetching or parsing fails.
 */
export async function loadQuestions(filenames) {
  // Handle both single filename (string) and array of filenames
  const filenamesToLoad = Array.isArray(filenames) ? filenames : [filenames];

  if (filenamesToLoad.length === 0) {
    throw new Error("No filenames provided to loadQuestions.");
  }

  console.log(
    `ExamManager: Loading questions from ${filenamesToLoad.length} files:`,
    filenamesToLoad
  );

  try {
    // Load all files in parallel using Promise.all
    const questionArrays = await Promise.all(
      filenamesToLoad.map((filename) => loadSingleFile(filename))
    );

    // Combine all question arrays into one
    const combinedQuestions = [].concat(...questionArrays);

    console.log(
      `ExamManager: Successfully loaded ${combinedQuestions.length} total questions from ${filenamesToLoad.length} files.`
    );
    return combinedQuestions;
  } catch (error) {
    console.error(`Error loading questions:`, error);
    // Re-throw the error so the caller can handle it
    throw error;
  }
}

/**
 * Helper function to load a single file
 * @param {string} filename - The name of the JSON file or full path
 * @returns {Promise<Array>} A promise that resolves with the array of questions from the file
 * @throws {Error} If fetching or parsing fails
 */
async function loadSingleFile(filename) {
  if (!filename) {
    throw new Error("loadSingleFile requires a filename.");
  }

  let filePath;

  // Determine if filename is a full path or just a filename
  // Full paths may include slashes, backslashes, or drive letters
  if (
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes(":")
  ) {
    // It's a full path, use as is
    filePath = filename;
    console.log(`ExamManager: Loading from custom path: ${filePath}`);
  } else {
    // It's just a filename, prepend the default directory
    filePath = `questions and answers/${filename}`;
    console.log(`ExamManager: Loading from default directory: ${filePath}`);
  }

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(
        `Failed to load ${response.url}: ${response.status} ${response.statusText}`
      );
    }

    const questionsData = await response.json();

    if (!Array.isArray(questionsData)) {
      throw new Error(
        `Invalid format: ${filename} did not contain a JSON array.`
      );
    }

    console.log(
      `ExamManager: Successfully loaded ${questionsData.length} questions from ${filename}.`
    );
    return questionsData; // Return the parsed questions array
  } catch (error) {
    console.error(`Error loading questions from ${filename}:`, error);
    // Re-throw the error so the caller can handle it
    throw error;
  }
}
