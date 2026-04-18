// Constants
const STRING_COUNT = 6;
const DEFAULT_TUNING = ['E', 'A', 'D', 'G', 'B', 'E']; // Display only
const NOTES_PER_BAR = 8; // We'll have 8 columns per bar (4/4 with eighth notes)

// State
let bars = [];

// DOM Elements
const tabContainer = document.getElementById('tabContainer');
const titleInput = document.getElementById('titleInput');
const addBarBtn = document.getElementById('addBarBtn');
const removeBarBtn = document.getElementById('removeBarBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

// Initialize with one empty bar
function init() {
  bars = [createEmptyBar()];
  render();
}

// Create an empty bar (2D array: strings x notes)
function createEmptyBar() {
  const barNotes = [];
  for (let s = 0; s < STRING_COUNT; s++) {
    barNotes.push(Array(NOTES_PER_BAR).fill(''));
  }
  return barNotes;
}

// Render the entire tab from the bars state
function render() {
  tabContainer.innerHTML = '';
  
  bars.forEach((barNotes, barIndex) => {
    const barDiv = document.createElement('div');
    barDiv.className = 'bar';
    barDiv.dataset.barIndex = barIndex;
    
    // Create rows for each string
    for (let stringIdx = 0; stringIdx < STRING_COUNT; stringIdx++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'string-row';
      
      // String label (e.g., "E |")
      const labelSpan = document.createElement('span');
      labelSpan.className = 'string-label';
      labelSpan.textContent = DEFAULT_TUNING[stringIdx] + ' |';
      rowDiv.appendChild(labelSpan);
      
      // Note inputs
      for (let noteIdx = 0; noteIdx < NOTES_PER_BAR; noteIdx++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'note-input';
        input.value = barNotes[stringIdx][noteIdx];
        input.dataset.string = stringIdx;
        input.dataset.note = noteIdx;
        input.dataset.bar = barIndex;
        
        // Update state when input changes
        input.addEventListener('input', (e) => {
          const val = e.target.value;
          const bar = parseInt(e.target.dataset.bar);
          const str = parseInt(e.target.dataset.string);
          const note = parseInt(e.target.dataset.note);
          bars[bar][str][note] = val;
        });
        
        rowDiv.appendChild(input);
      }
      
      barDiv.appendChild(rowDiv);
    }
    
    tabContainer.appendChild(barDiv);
  });
}

// Add a new bar
function addBar() {
  bars.push(createEmptyBar());
  render();
}

// Remove last bar (if more than one)
function removeBar() {
  if (bars.length > 1) {
    bars.pop();
    render();
  } else {
    alert("You need at least one bar.");
  }
}

// Export to .tab file (JSON)
function exportTab() {
  const title = titleInput.value || 'Untitled';
  const tuning = DEFAULT_TUNING;
  
  const tabData = {
    title: title,
    tuning: tuning,
    strings: STRING_COUNT,
    bars: bars.map(bar => {
      // Convert to our format: array of columns (each column is array of fret numbers)
      const columns = [];
      for (let noteIdx = 0; noteIdx < NOTES_PER_BAR; noteIdx++) {
        const column = [];
        for (let strIdx = 0; strIdx < STRING_COUNT; strIdx++) {
          const val = bar[strIdx][noteIdx];
          column.push(val === '' ? null : val);
        }
        columns.push(column);
      }
      return { strings: columns };
    })
  };
  
  const jsonStr = JSON.stringify(tabData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.tab`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import from .tab file
function importTab(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const tabData = JSON.parse(e.target.result);
      
      // Validate basic structure
      if (!tabData.bars || !Array.isArray(tabData.bars)) {
        throw new Error('Invalid .tab file: missing bars array');
      }
      
      // Set title if present
      if (tabData.title) titleInput.value = tabData.title;
      
      // Rebuild bars array from imported data
      const newBars = [];
      for (const bar of tabData.bars) {
        const columns = bar.strings;
        if (!columns) continue;
        
        // Create empty bar first
        const barNotes = Array(STRING_COUNT).fill().map(() => Array(NOTES_PER_BAR).fill(''));
        
        // Fill in notes
        for (let noteIdx = 0; noteIdx < Math.min(columns.length, NOTES_PER_BAR); noteIdx++) {
          const column = columns[noteIdx];
          for (let strIdx = 0; strIdx < Math.min(column.length, STRING_COUNT); strIdx++) {
            const fret = column[strIdx];
            if (fret !== null && fret !== undefined) {
              barNotes[strIdx][noteIdx] = String(fret);
            }
          }
        }
        newBars.push(barNotes);
      }
      
      if (newBars.length > 0) {
        bars = newBars;
        render();
      } else {
        alert('No bars found in file.');
      }
    } catch (err) {
      alert('Error parsing .tab file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// Event listeners
addBarBtn.addEventListener('click', addBar);
removeBarBtn.addEventListener('click', removeBar);
exportBtn.addEventListener('click', exportTab);
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    importTab(file);
    importFile.value = ''; // Allow re-importing same file
  }
});

// Start the app
init();
