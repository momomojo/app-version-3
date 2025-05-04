// --- Lab Values Module ---

// --- State Variables ---
let labValuesData = null; // To store fetched lab values
let isLabDataFetched = false; // Track if data fetch attempted

// --- DOM Elements ---
// Note: These assume elements with these IDs exist in index.html
const labValuesPanel = document.getElementById("lab-values-panel");
const labTabButtons = document.getElementById("lab-tab-buttons");
const labTabContentArea = document.getElementById("lab-tab-content-area");
const closeLabValuesButton = document.getElementById("close-lab-panel"); // ID matches HTML close button

// --- Functions ---

// Fetches lab values data from JSON file
async function fetchLabValues() {
  console.log("LabValues: Fetching lab values...");
  if (!labTabContentArea) {
    console.error(
      "LabValues: labTabContentArea element not found, cannot display errors or data."
    );
    return; // Cannot proceed without content area
  }
  try {
    // Corrected filename from lab_values.json to lab-values.json
    const response = await fetch("lab-values.json"); // Ensure this file exists and is accessible
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    labValuesData = data;
    console.log("LabValues: Lab values fetched successfully.");
    // It's better to call render after fetch completes successfully
    // renderLabValuesTabs(); // Consider calling this only when panel is opened
  } catch (error) {
    console.error("LabValues: Error fetching lab values:", error);
    // Display error within the panel instead of alert
    labTabContentArea.innerHTML = `<p style="color: red; padding: 10px;">Failed to load lab values. ${error.message}</p>`;
    labValuesData = null; // Ensure data is null on error
  }
}

// Renders the tabs and content based on fetched data - REPLACED with original logic
function renderLabValuesTabs() {
  console.log(
    "LabValues: renderLabValuesTabs function start (using original logic)"
  );
  if (!labTabButtons || !labTabContentArea) {
    console.error("LabValues: Tab buttons or content area element not found!");
    return;
  }
  if (!labValuesData || !Array.isArray(labValuesData)) {
    console.error("LabValues: Lab values data is missing or not an array.");
    labTabButtons.innerHTML = "<p>Error loading lab values data.</p>";
    labTabContentArea.innerHTML = "";
    return;
  }

  labTabButtons.innerHTML = ""; // Clear existing tabs
  labTabContentArea.innerHTML = ""; // Clear existing content

  // --- Define Tab Structure and Data Collection (from original) ---
  const tabDefinitions = {
    Serum: {
      keys: [
        "SERUM",
        "Lipids",
        "Iron Studies",
        "Endocrine",
        "Immunoglobulins",
        "GASES, ARTERIAL BLOOD (ROOM AIR)",
      ],
      items: [],
    },
    Blood: { keys: ["HEMATOLOGIC", "Coagulation"], items: [] },
    Cerebrospinal: { keys: ["CEREBROSPINAL FLUID"], items: [] },
    "Urine & BMI": { keys: ["URINE", "BODY MASS INDEX (BMI)"], items: [] },
  };

  // Iterate through the raw JSON data and distribute items (from original)
  labValuesData.forEach((sectionObject) => {
    const mainKey = Object.keys(sectionObject)[0];
    if (!mainKey) return;
    const sectionData = sectionObject[mainKey];

    // Find which tab this mainKey belongs to
    let targetTabName = null;
    for (const tabName in tabDefinitions) {
      if (tabDefinitions[tabName].keys.includes(mainKey)) {
        targetTabName = tabName;
        break;
      }
    }

    if (targetTabName) {
      const targetItems = tabDefinitions[targetTabName].items;

      if (Array.isArray(sectionData)) {
        // Direct list of tests (e.g., Lipids, CSF, Coagulation)
        targetItems.push(...sectionData);
      } else if (typeof sectionData === "object" && sectionData !== null) {
        if (mainKey === "BODY MASS INDEX (BMI)") {
          // Special handling for BMI
          if (sectionData.test) {
            targetItems.push({
              test: `BMI (${sectionData.test})`, // Include 'Adult'
              referenceRange: sectionData.referenceRange || "",
              siReferenceIntervals: sectionData.siReferenceIntervals || "",
            });
          }
        } else {
          // Object with sub-categories (e.g., SERUM, HEMATOLOGIC)
          for (const subCategoryKey in sectionData) {
            if (Array.isArray(sectionData[subCategoryKey])) {
              // Add items, maybe prefix test name with subCategoryKey if needed for context?
              // Example shows flattening, so we just add items directly.
              targetItems.push(...sectionData[subCategoryKey]);
            }
          }
        }
      }
    }
  });

  console.log(
    "LabValues: Data collection complete. tabDefinitions:",
    JSON.parse(JSON.stringify(tabDefinitions))
  ); // Log a deep copy

  // --- Create Tabs and Content (using original structure) ---
  let isFirstTab = true;
  for (const tabName in tabDefinitions) {
    console.log(`LabValues: Creating tab for '${tabName}'`);
    const tabId = tabName.replace(/\s*&\s*/g, "-").replace(/\s+/g, "-"); // Create a safe ID
    createTabAndContent(
      tabId,
      tabName,
      tabDefinitions[tabName].items,
      isFirstTab
    );
    if (isFirstTab) isFirstTab = false;
  }

  // Re-add event listeners *after* elements are created
  document.querySelectorAll("#lab-tab-buttons button").forEach((button) => {
    button.removeEventListener("click", handleTabClick); // Remove old just in case
    button.addEventListener("click", handleTabClick);
  });
}

// Helper function to create tab button and content pane (minor change from original)
function createTabAndContent(tabId, tabName, itemsArray, isFirst) {
  if (!labTabButtons || !labTabContentArea) return; // Guard clause

  // Create Tab Button
  const tabButton = document.createElement("button");
  tabButton.textContent = tabName;
  tabButton.dataset.tabId = tabId;
  // Listener added after all buttons are in the DOM in renderLabValuesTabs
  // tabButton.addEventListener('click', handleTabClick);
  labTabButtons.appendChild(tabButton);

  // Create Tab Content Pane
  const contentPane = document.createElement("div");
  contentPane.id = `tab-${tabId}`;
  contentPane.classList.add("tab-content");
  // Generate a single table containing all items for this tab using original logic
  contentPane.innerHTML = createTableHTML(itemsArray);
  labTabContentArea.appendChild(contentPane);

  if (isFirst) {
    tabButton.classList.add("active");
    contentPane.classList.add("active");
  }
}

// Helper function to handle clicking on a tab button (same as before)
function handleTabClick(event) {
  const tabId = event.target.dataset.tabId;
  if (!tabId) return;

  // Deactivate all tabs and content within the lab panel
  labTabButtons
    .querySelectorAll("button")
    .forEach((button) => button.classList.remove("active"));
  labTabContentArea
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  // Activate clicked tab and corresponding content
  event.target.classList.add("active");
  const activeContent = labTabContentArea.querySelector(`#tab-${tabId}`);
  if (activeContent) activeContent.classList.add("active");
}

// Helper function to create the HTML for a single table - REPLACED with original logic
function createTableHTML(itemsArray) {
  if (!itemsArray || itemsArray.length === 0)
    return "<p>No data available for this section.</p>";

  let tableHTML =
    '<table class="lab-values-table"><thead><tr><th>Test</th><th>Reference Range</th></tr></thead><tbody>';

  itemsArray.forEach((item) => {
    if (!item || !item.test) return; // Skip null/undefined items or items without a test name

    let testName = item.test;
    let displayRange = ""; // Column to display the formatted range

    // --- Handle complex nested structures (from original) ---
    if (item.subTests && Array.isArray(item.subTests)) {
      // Render subTests as indented items under the main test
      tableHTML += `<tr><td style="font-weight: bold;">${testName}</td><td></td></tr>`; // Main test row
      item.subTests.forEach((subTest) => {
        displayRange = (subTest.referenceRange || "").replace(/\n/g, "<br>");
        // Optionally include SI units if needed: displayRange += `<br><i>SI: ${(subTest.siReferenceIntervals || '').replace(/\n/g, '<br>')}</i>`;
        tableHTML += `<tr><td style="padding-left: 20px;">${
          subTest.test || ""
        }</td><td>${displayRange}</td></tr>`;
      });
      return; // Skip default row rendering below
    } else if (item.subRanges && Array.isArray(item.subRanges)) {
      displayRange = item.subRanges
        .map((sr) => `${sr.type || ""}: ${sr.referenceRange || ""}`)
        .join("<br>");
    } else if (item.genderRanges && typeof item.genderRanges === "object") {
      displayRange = Object.entries(item.genderRanges)
        .map(([gender, range]) => `${gender}: ${range}`)
        .join("<br>");
    } else if (item.ranges && Array.isArray(item.ranges)) {
      displayRange = item.ranges
        .map((r) => `${r.type || ""}: ${r.referenceRange || ""}`)
        .join("<br>");
    } else if (item.timepoints && Array.isArray(item.timepoints)) {
      displayRange = item.timepoints
        .map((tp) => `${tp.time || ""}: ${tp.referenceRange || ""}`)
        .join("<br>");
    } else {
      // Default case: simple referenceRange
      displayRange = (item.referenceRange || "").replace(/\n/g, "<br>");
    }

    // Optionally include SI units if needed and present
    // if (item.siReferenceIntervals) {
    //     displayRange += `<br><i>SI: ${item.siReferenceIntervals}</i>`;
    // }

    // --- End complex structure handling ---
    tableHTML += `<tr><td>${testName}</td><td>${displayRange}</td></tr>`;
  });
  tableHTML += "</tbody></table>";
  return tableHTML;
}

// --- Panel Open/Close Logic ---

// Export this function so it can be called by the button listener in uiController/renderer
export function openLabValuesPanel() {
  console.log("LabValues: Opening Lab Values Panel...");
  // Ensure mainWrapper is selected (might need to select it here if not global)
  const mainWrapper = document.querySelector(".main-wrapper");
  if (!labValuesPanel || !mainWrapper) {
    console.error("LabValues: Lab panel or main wrapper element not found!");
    return;
  }

  // Fetch data only if it hasn't been fetched yet
  if (!isLabDataFetched) {
    console.log("LabValues: Data not fetched, calling fetchLabValues...");
    isLabDataFetched = true; // Mark as fetched (or attempting to fetch)
    fetchLabValues().then(() => {
      console.log(
        "LabValues: Fetch complete (async). Rendering tabs if data exists..."
      );
      // Render *after* fetch completes
      if (labValuesData) {
        renderLabValuesTabs();
      } else {
        // Error message should already be in content area from fetchLabValues
        console.log("LabValues: No data to render after fetch.");
      }
      // Open panel regardless of fetch success to show potential error
      // Use lab-panel-active on mainWrapper instead of open/panel-open
      mainWrapper.classList.add("lab-panel-active");
    });
  } else {
    // If already fetched, just open the panel
    console.log("LabValues: Data already fetched. Opening panel.");
    // Use lab-panel-active on mainWrapper instead of open/panel-open
    mainWrapper.classList.add("lab-panel-active");
    // Ensure tabs are rendered if panel was closed before fetch finished
    if (
      labValuesData &&
      labTabContentArea &&
      labTabContentArea.innerHTML.trim() === ""
    ) {
      console.log("LabValues: Re-rendering tabs as content area was empty.");
      renderLabValuesTabs();
    }
  }
}

// Also export this function so it can be called from uiController
export function closeLabValuesPanel() {
  console.log("LabValues: Closing Lab Values Panel...");
  // Ensure mainWrapper is selected
  const mainWrapper = document.querySelector(".main-wrapper");
  // Use lab-panel-active on mainWrapper instead of open/panel-open
  if (mainWrapper) mainWrapper.classList.remove("lab-panel-active");
  // if (labValuesPanel) labValuesPanel.classList.remove("open"); // Remove this
  // if (mainWrapper) mainWrapper.classList.remove("panel-open"); // Remove this
}

// --- Event Listener Setup ---
document.addEventListener("DOMContentLoaded", () => {
  // Lab Values Button Listener (This button might be in the main HTML, not controlled here)
  // The listener to *open* the panel should be attached where the button lives (e.g., renderer.js or uiController.js)

  // Close Button Listener (Assuming button is inside the panel's HTML)
  if (closeLabValuesButton) {
    closeLabValuesButton.addEventListener("click", closeLabValuesPanel);
    console.log("LabValues: Close button listener attached.");
  } else {
    console.warn("LabValues: Close button not found (ID: close-lab-values)");
  }

  // Optionally pre-fetch data on load?
  // fetchLabValues(); // Could slow down initial load
});

console.log("labValues.js loaded");
