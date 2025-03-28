// Get DOM elements
const editor = document.getElementById('editor');
const downloadTxtBtn = document.getElementById('downloadTxtBtn');
const undoBtn = document.getElementById('undoBtn');

// History management
let textHistory = [];
let currentHistoryIndex = -1;
const MAX_HISTORY_LENGTH = 50;

// Add text to history
function addToHistory(text) {
    // Remove any future states if we're not at the end of history
    if (currentHistoryIndex < textHistory.length - 1) {
        textHistory = textHistory.slice(0, currentHistoryIndex + 1);
    }
    
    // Add new state
    textHistory.push(text);
    
    // Limit history size
    if (textHistory.length > MAX_HISTORY_LENGTH) {
        textHistory.shift();
    } else {
        currentHistoryIndex++;
    }
    
    // Update undo button state
    updateUndoButton();
}

// Update undo button state
function updateUndoButton() {
    undoBtn.disabled = currentHistoryIndex <= 0;
    undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
    undoBtn.style.cursor = undoBtn.disabled ? 'not-allowed' : 'pointer';
}

// Undo functionality
function undo() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        editor.innerHTML = textHistory[currentHistoryIndex];
        updateUndoButton();
    }
}

// Set initial placeholder and add to history
if (editor.innerHTML === '') {
    editor.innerHTML = '<span style="color: #808080;">Enter or paste your text here...</span>';
    addToHistory(editor.innerHTML);
}

// Handle paste events to sanitize text
editor.addEventListener('paste', (e) => {
    e.preventDefault();
    
    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain');
    
    // Insert the text at the current cursor position
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    
    // Add to history after paste
    addToHistory(editor.innerHTML);
});

// Download functionality
function downloadFile(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// TXT download handler
downloadTxtBtn.addEventListener('click', () => {
    const text = editor.innerText;
    if (!text || text === 'Enter or paste your text here...') {
        alert('Please enter some text before downloading.');
        return;
    }
    downloadFile(text, 'text/plain', 'text-manipulator.txt');
});

// Handle placeholder text
editor.addEventListener('focus', function() {
    if (this.innerHTML === '<span style="color: #808080;">Enter or paste your text here...</span>') {
        this.innerHTML = '';
        addToHistory('');
    }
});

editor.addEventListener('blur', function() {
    if (this.innerHTML === '') {
        this.innerHTML = '<span style="color: #808080;">Enter or paste your text here...</span>';
        addToHistory(this.innerHTML);
    }
});

// Add keyboard shortcut for undo
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
});

// Add undo button click handler
undoBtn.addEventListener('click', undo);

// Text manipulation functions
function manipulateText(action) {
    let text = editor.innerText;
    if (!text || text === 'Enter or paste your text here...') {
        alert('Please enter some text before applying transformations.');
        return;
    }

    switch(action) {
        // Cleanup operations
        case 'dedent':
            text = text.split('\n').map(line => line.trimStart()).join('\n');
            break;
        case 'removeAllWhitespace':
            text = text.replace(/\s+/g, '');
            break;
        case 'removeDuplicates':
            text = [...new Set(text.split('\n'))].join('\n');
            break;
        case 'removeEmptyLines':
            text = text.split('\n').filter(line => line.trim()).join('\n');
            break;
        case 'removeLineBreaks':
            text = text.replace(/\n/g, ' ');
            break;
        case 'removeNonPrintable':
            text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            break;
        case 'removeSpecialChars':
            text = text.replace(/[^a-zA-Z0-9\s]/g, '');
            break;
        case 'stripHtml':
            text = text.replace(/<[^>]*>/g, '');
            break;
        case 'trimWhitespace':
            text = text.split('\n').map(line => line.trim()).join('\n');
            break;

        // Formatting operations
        case 'addLineNumbers':
            text = text.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
            break;
        case 'capitalizeWords':
            text = text.split('\n').map(line => 
                line.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')
            ).join('\n');
            break;
        case 'toLowerCase':
            text = text.toLowerCase();
            break;
        case 'toUpperCase':
            text = text.toUpperCase();
            break;
        case 'escapeHtml':
            text = text.replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));
            break;
        case 'unescapeHtml':
            text = text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, char => ({
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&quot;': '"',
                '&#39;': "'"
            }[char]));
            break;
        case 'prefixSuffix':
            const prefix = prompt('Enter prefix (or leave empty):');
            const suffix = prompt('Enter suffix (or leave empty):');
            if (prefix !== null && suffix !== null) {
                text = text.split('\n').map(line => 
                    (prefix || '') + line + (suffix || '')
                ).join('\n');
            }
            break;
        case 'reverseChars':
            text = text.split('\n').map(line => 
                line.split('').reverse().join('')
            ).join('\n');
            break;
        case 'reverseLines':
            text = text.split('\n').reverse().join('\n');
            break;
        case 'sortAscending':
            text = text.split('\n').sort().join('\n');
            break;
        case 'sortDescending':
            text = text.split('\n').sort().reverse().join('\n');
            break;
        case 'wrapLines':
            const width = prompt('Enter line width (characters):');
            if (width && !isNaN(width)) {
                text = text.split('\n').map(line => {
                    const words = line.split(' ');
                    let result = '';
                    let currentLine = '';
                    words.forEach(word => {
                        if ((currentLine + word).length > width) {
                            result += currentLine.trim() + '\n';
                            currentLine = word + ' ';
                        } else {
                            currentLine += word + ' ';
                        }
                    });
                    return result + currentLine.trim();
                }).join('\n');
            }
            break;

        // Conversion operations
        case 'prettyJson':
            try {
                const json = JSON.parse(text);
                text = JSON.stringify(json, null, 2);
            } catch (e) {
                alert('Invalid JSON input');
                return;
            }
            break;
        case 'listToJson':
            text = JSON.stringify(text.split('\n').filter(line => line.trim()));
            break;
        case 'toSlug':
            text = text.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            break;
        case 'toCsv':
            text = text.split('\n').map(line => 
                line.split(/\s+/).join(',')
            ).join('\n');
            break;
        case 'toTsv':
            text = text.split('\n').map(line => 
                line.split(/\s+/).join('\t')
            ).join('\n');
            break;
        case 'encodeBase64':
            text = btoa(text);
            break;
        case 'decodeBase64':
            try {
                text = atob(text);
            } catch (e) {
                alert('Invalid Base64 input');
                return;
            }
            break;
        case 'encodeUrl':
            text = encodeURIComponent(text);
            break;
        case 'decodeUrl':
            try {
                text = decodeURIComponent(text);
            } catch (e) {
                alert('Invalid URL-encoded input');
                return;
            }
            break;
    }

    // Update the editor content and add to history
    editor.innerHTML = text;
    addToHistory(text);
} 