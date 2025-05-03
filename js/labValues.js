// --- Lab Values Module ---

// --- State Variables ---
let labValuesData = null; // To store fetched lab values
let isLabDataFetched = false; // Track if data fetch attempted

// --- DOM Elements ---
// Note: These assume elements with these IDs exist in index.html
const labValuesPanel = document.getElementById('lab-values-panel');
const labTabButtons = document.getElementById('lab-tab-buttons');
const labTabContentArea = document.getElementById('lab-tab-content-area');
const closeLabValuesButton = document.getElementById('close-lab-panel'); // ID matches HTML close button

// --- Functions ---

// Fetches lab values data from JSON file
async function fetchLabValues() {
    console.log("LabValues: Fetching lab values...");
    if (!labTabContentArea) {
        console.error("LabValues: labTabContentArea element not found, cannot display errors or data.");
        return; // Cannot proceed without content area
    }
    try {
        // Corrected filename from lab_values.json to lab-values.json
        const response = await fetch('lab-values.json'); // Ensure this file exists and is accessible
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        labValuesData = data;
        console.log("LabValues: Lab values fetched successfully.");
        // It's better to call render after fetch completes successfully
        // renderLabValuesTabs(); // Consider calling this only when panel is opened
    } catch (error) {
        console.error('LabValues: Error fetching lab values:', error);
        // Display error within the panel instead of alert
        labTabContentArea.innerHTML = `<p style="color: red; padding: 10px;">Failed to load lab values. ${error.message}</p>`;
        labValuesData = null; // Ensure data is null on error
    }
}

// Renders the tabs and content based on fetched data
function renderLabValuesTabs() {
    console.log("LabValues: renderLabValuesTabs function start");
    if (!labTabButtons || !labTabContentArea) {
        console.error("LabValues: Tab buttons or content area element not found!");
        return;
    }
    if (!labValuesData || !Array.isArray(labValuesData)) {
        console.error("LabValues: Lab values data is missing or not an array.");
        labTabButtons.innerHTML = ''; // Clear buttons even on error
        labTabContentArea.innerHTML = '<p style="color: red; padding: 10px;">Error: Lab values data not available.</p>';
        return;
    }

    labTabButtons.innerHTML = ''; // Clear existing tabs
    labTabContentArea.innerHTML = ''; // Clear existing content

    // --- Define Tab Structure and Data Collection --- 
    // Group data by category (e.g., 'Chemistry', 'Hematology', etc.)
    const groupedData = labValuesData.reduce((acc, item) => {
        const category = item.category || 'Uncategorized'; // Default category
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    console.log("LabValues: Data grouped by category.", groupedData);

    // --- Create Tabs and Content --- 
    let isFirstTab = true;
    for (const categoryName in groupedData) {
        console.log(`LabValues: Creating tab for '${categoryName}'`);
        // Create a safe ID (e.g., 'chemistry-panel', 'hematology-panel')
        const tabId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        createTabAndContent(tabId, categoryName, groupedData[categoryName], isFirstTab);
        if (isFirstTab) isFirstTab = false;
    }

     // Add event listeners *after* elements are created
     // This was likely missing before
     document.querySelectorAll('#lab-tab-buttons button').forEach(button => {
         button.addEventListener('click', handleTabClick);
     });

}

// Helper function to create tab button and content pane
function createTabAndContent(tabId, tabName, itemsArray, isFirst) {
     if (!labTabButtons || !labTabContentArea) return; // Guard clause

    // Create Tab Button
    const tabButton = document.createElement('button');
    tabButton.textContent = tabName;
    tabButton.dataset.tabId = tabId;
    // tabButton.addEventListener('click', handleTabClick); // Add listener after all buttons are added
    labTabButtons.appendChild(tabButton);

    // Create Tab Content Pane
    const contentPane = document.createElement('div');
    contentPane.id = `tab-${tabId}`;
    contentPane.classList.add('tab-content');
    // Generate a single table containing all items for this tab
    contentPane.innerHTML = createTableHTML(itemsArray);
    labTabContentArea.appendChild(contentPane);

    if (isFirst) {
        tabButton.classList.add('active');
        contentPane.classList.add('active');
    }
}

// Helper function to handle clicking on a tab button
function handleTabClick(event) {
    const tabId = event.target.dataset.tabId;
    if (!tabId) return;

    // Deactivate all tabs and content within the lab panel
    labTabButtons.querySelectorAll('button').forEach(button => button.classList.remove('active'));
    labTabContentArea.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activate clicked tab and corresponding content
    event.target.classList.add('active');
    const activeContent = labTabContentArea.querySelector(`#tab-${tabId}`);
    if (activeContent) activeContent.classList.add('active');
}

// Helper function to create the HTML for a single table from an array of test items
function createTableHTML(itemsArray) {
    if (!itemsArray || itemsArray.length === 0) return '<p>No data available for this section.</p>';

    let tableHTML = '<table class="lab-values-table"><thead><tr><th>Test</th><th>Reference Range</th></tr></thead><tbody>';

    itemsArray.forEach(item => {
        const testName = item.test || 'N/A';
        let displayRange = '';

        // Handle potentially complex structure for referenceRange
        if (typeof item.referenceRange === 'object' && item.referenceRange !== null) {
             // Example: Join Male/Female ranges or other structured data
            displayRange = Object.entries(item.referenceRange)
                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                .join('<br>');
        } else {
            // Default case: simple referenceRange string
            displayRange = (item.referenceRange || '').replace(/\n/g, '<br>');
        }

        // Optionally include SI units if needed and present
        // if (item.siReferenceIntervals) {
        //     displayRange += `<br><i>SI: ${item.siReferenceIntervals}</i>`;
        // }

        tableHTML += `<tr><td>${testName}</td><td>${displayRange}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    return tableHTML;
}


// --- Panel Open/Close Logic ---

function openLabValuesPanel() {
    console.log("LabValues: Opening Lab Values Panel...");
    if (!labValuesPanel || !mainWrapper) {
        console.error("LabValues: Lab panel or main wrapper element not found!");
        return;
    }

    // Fetch data only if it hasn't been fetched yet
    if (!isLabDataFetched) {
        console.log("LabValues: Data not fetched, calling fetchLabValues...");
        isLabDataFetched = true; // Mark as fetched (or attempting to fetch)
        fetchLabValues().then(() => {
            console.log("LabValues: Fetch complete (async). Rendering tabs if data exists...");
            // Render *after* fetch completes
             if(labValuesData) {
                renderLabValuesTabs();
             } else {
                 // Error message should already be in content area from fetchLabValues
                 console.log("LabValues: No data to render after fetch.");
             }
             // Open panel regardless of fetch success to show potential error
            labValuesPanel.classList.add('open');
            mainWrapper.classList.add('panel-open');
        });
    } else {
        // If already fetched, just open the panel
        // Re-rendering might be needed if data could change, but unlikely here.
        console.log("LabValues: Data already fetched. Opening panel.");
        labValuesPanel.classList.add('open');
        mainWrapper.classList.add('panel-open');
         // Ensure tabs are rendered if panel was closed before fetch finished
         if(labValuesData && labTabContentArea && labTabContentArea.innerHTML.trim() === '') {
             console.log("LabValues: Re-rendering tabs as content area was empty.");
             renderLabValuesTabs();
         }
    }
}

function closeLabValuesPanel() {
    console.log("LabValues: Closing Lab Values Panel...");
    if (labValuesPanel) labValuesPanel.classList.remove('open');
    if (mainWrapper) mainWrapper.classList.remove('panel-open');
}

// --- Event Listener Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Lab Values Button Listener (This button might be in the main HTML, not controlled here)
    // The listener to *open* the panel should be attached where the button lives (e.g., renderer.js or uiController.js)

    // Close Button Listener (Assuming button is inside the panel's HTML)
    if (closeLabValuesButton) {
        closeLabValuesButton.addEventListener('click', closeLabValuesPanel);
        console.log("LabValues: Close button listener attached.");
    } else {
        console.warn("LabValues: Close button not found (ID: close-lab-values)");
    }

    // Optionally pre-fetch data on load?
    // fetchLabValues(); // Could slow down initial load
});

console.log("labValues.js loaded");
