// Constants
const EDITOR_PLACEHOLDER = 'Enter or paste your text here...';
const READING_SPEED = 200; // words per minute
const SPEAKING_SPEED = 130; // words per minute
const STATS_UPDATE_DELAY = 500; // ms delay for stats updates
const LARGE_TEXT_THRESHOLD = 10000; // characters

// DOM Elements
const editor = document.getElementById('editor');
const downloadTxtBtn = document.getElementById('downloadTxtBtn');
const undoBtn = document.getElementById('undoBtn');
const copyBtn = document.getElementById('copyBtn');
const fullWidthToggle = document.getElementById('fullWidthToggle');
const editorContainer = document.querySelector('.editor-container');
const showAdvancedStats = document.getElementById('showAdvancedStats');
const advancedStats = document.getElementById('advancedStats');
const loadingOverlay = document.getElementById('loadingOverlay');

// History management
let history = [];
let currentIndex = -1;
let statsUpdateTimeout = null;

function showLoading() {
    loadingOverlay.classList.add('active');
    const loadingText = loadingOverlay.querySelector('.loading-text');
    if (loadingText) {
        loadingText.style.display = 'block';
    }
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
    const loadingText = loadingOverlay.querySelector('.loading-text');
    if (loadingText) {
        loadingText.style.display = 'none';
    }
}

function addToHistory(text) {
    // Remove any future states if we're not at the end
    if (currentIndex < history.length - 1) {
        history = history.slice(0, currentIndex + 1);
    }
    
    // Add new state
    history.push(text);
    currentIndex++;
    
    // Limit history size to prevent memory issues
    if (history.length > 50) {
        history.shift();
        currentIndex--;
    }
    
    // Update undo button state
    updateUndoButton();
}

function undo() {
    if (currentIndex > 0) {
        currentIndex--;
        editor.innerText = history[currentIndex];
        updateUndoButton();
    }
}

function updateUndoButton() {
    undoBtn.disabled = currentIndex <= 0;
}

// Text manipulation functions
function manipulateText(action) {
    try {
        const text = editor.innerText;
        let result = text;

        switch (action) {
            case 'dedent':
                result = text.split('\n').map(line => line.trimStart()).join('\n');
                break;
            case 'removeAllWhitespace':
                result = text.replace(/\s+/g, '');
                break;
            case 'removeDuplicates':
                result = [...new Set(text.split('\n'))].join('\n');
                break;
            case 'removeEmptyLines':
                result = text.split('\n').filter(line => line.trim()).join('\n');
                break;
            case 'removeLineBreaks':
                result = text.replace(/\n/g, ' ');
                break;
            case 'removeNonPrintable':
                result = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                break;
            case 'removeSpecialChars':
                result = text.replace(/[^a-zA-Z0-9\s]/g, '');
                break;
            case 'stripHtml':
                result = text.replace(/<[^>]*>/g, '');
                break;
            case 'trimWhitespace':
                result = text.split('\n').map(line => line.trim()).join('\n');
                break;
            case 'addLineNumbers':
                result = text.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
                break;
            case 'capitalizeWords':
                result = text.split('\n').map(line => 
                    line.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ')
                ).join('\n');
                break;
            case 'toLowerCase':
                result = text.toLowerCase();
                break;
            case 'toUpperCase':
                result = text.toUpperCase();
                break;
            case 'escapeHtml':
                result = text.replace(/[&<>"']/g, char => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[char]));
                break;
            case 'unescapeHtml':
                result = text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, entity => ({
                    '&amp;': '&',
                    '&lt;': '<',
                    '&gt;': '>',
                    '&quot;': '"',
                    '&#39;': "'"
                }[entity]));
                break;
            case 'prefixSuffix':
                const prefix = prompt('Enter prefix (or leave empty for none):', '');
                const suffix = prompt('Enter suffix (or leave empty for none):', '');
                if (prefix === null || suffix === null) return;
                result = text.split('\n').map(line => `${prefix}${line}${suffix}`).join('\n');
                break;
            case 'reverseChars':
                result = text.split('\n').map(line => line.split('').reverse().join('')).join('\n');
                break;
            case 'reverseLines':
                result = text.split('\n').reverse().join('\n');
                break;
            case 'sortAscending':
                result = text.split('\n').sort().join('\n');
                break;
            case 'sortDescending':
                result = text.split('\n').sort().reverse().join('\n');
                break;
            case 'wrapLines':
                const width = parseInt(prompt('Enter line width:', '80'));
                if (isNaN(width) || width <= 0) return;
                result = text.split('\n').map(line => {
                    const words = line.split(' ');
                    let currentLine = '';
                    const wrappedLines = [];
                    words.forEach(word => {
                        if ((currentLine + word).length > width) {
                            wrappedLines.push(currentLine.trim());
                            currentLine = word;
                        } else {
                            currentLine += (currentLine ? ' ' : '') + word;
                        }
                    });
                    if (currentLine) wrappedLines.push(currentLine.trim());
                    return wrappedLines.join('\n');
                }).join('\n');
                break;
            case 'prettyJson':
                try {
                    const jsonObj = JSON.parse(text);
                    result = JSON.stringify(jsonObj, null, 2);
                } catch (e) {
                    alert('Invalid JSON format');
                    return;
                }
                break;
            case 'listToJson':
                result = JSON.stringify(text.split('\n').filter(line => line.trim()), null, 2);
                break;
            case 'toSlug':
                result = text.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                break;
            case 'toCsv':
                result = text.split('\n').map(line => 
                    line.split(/\s+/).map(cell => 
                        cell.includes(',') ? `"${cell}"` : cell
                    ).join(',')
                ).join('\n');
                break;
            case 'toTsv':
                result = text.split('\n').map(line => 
                    line.split(/\s+/).join('\t')
                ).join('\n');
                break;
            case 'encodeBase64':
                try {
                    result = btoa(text);
                } catch (e) {
                    alert('Error encoding to Base64. Text may contain invalid characters.');
                    return;
                }
                break;
            case 'decodeBase64':
                try {
                    result = atob(text);
                } catch (e) {
                    alert('Invalid Base64 format');
                    return;
                }
                break;
            case 'encodeUrl':
                result = encodeURIComponent(text);
                break;
            case 'decodeUrl':
                try {
                    result = decodeURIComponent(text);
                } catch (e) {
                    alert('Invalid URL encoding');
                    return;
                }
                break;
            default:
                console.warn('Unknown action:', action);
                return;
        }

        editor.innerText = result;
        addToHistory(result);
    } catch (error) {
        console.error('Error in text manipulation:', error);
        alert('An error occurred while processing the text. Please try again.');
    }
}

// Download functionality
function downloadText() {
    try {
        const text = editor.innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading text:', error);
        alert('An error occurred while downloading the file. Please try again.');
    }
}

// Statistics functionality
function calculateStats() {
    try {
        const text = editor.innerText;
        if (!text || text === EDITOR_PLACEHOLDER) {
            resetStats();
            return;
        }

        // Basic stats
        const lines = text.split('\n').length;
        const chars = text.length;
        const selected = window.getSelection().toString().length;

        // Update basic stats
        document.getElementById('lineCount').textContent = lines;
        document.getElementById('charCount').textContent = chars;
        document.getElementById('selectedCount').textContent = selected;

        if (showAdvancedStats.checked) {
            // Word stats
            const words = text.match(/\S+/g) || [];
            const uniqueWords = new Set(words.map(w => w.toLowerCase()));
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
            const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;

            // Character stats
            const numeric = (text.match(/\d/g) || []).length;
            const whitespace = (text.match(/\s/g) || []).length;
            const punctuation = (text.match(/[^\w\s]/g) || []).length;
            const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;

            // Calculate averages
            const avgWordsPerSentence = sentences.length ? (words.length / sentences.length).toFixed(1) : 0;
            const avgCharsPerWord = words.length ? (chars / words.length).toFixed(1) : 0;

            // Calculate reading and speaking time
            const readingTime = Math.ceil(words.length / READING_SPEED);
            const speakingTime = Math.ceil(words.length / SPEAKING_SPEED);

            // Calculate byte sizes
            const utf8Size = new TextEncoder().encode(text).length;
            const utf16Size = text.length * 2; // Approximate UTF-16 size

            // Find most common word
            const wordFrequency = {};
            words.forEach(word => {
                word = word.toLowerCase();
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            });
            const mostCommonWord = Object.entries(wordFrequency)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || '-';

            // Update advanced stats
            document.getElementById('wordCount').textContent = words.length;
            document.getElementById('uniqueWordCount').textContent = uniqueWords.size;
            document.getElementById('sentenceCount').textContent = sentences.length;
            document.getElementById('paragraphCount').textContent = paragraphs;
            document.getElementById('avgWordsPerSentence').textContent = avgWordsPerSentence;
            document.getElementById('avgCharsPerWord').textContent = avgCharsPerWord;
            document.getElementById('numericCount').textContent = numeric;
            document.getElementById('whitespaceCount').textContent = whitespace;
            document.getElementById('punctuationCount').textContent = punctuation;
            document.getElementById('nonAsciiCount').textContent = nonAscii;
            document.getElementById('readingTime').textContent = `${readingTime} min`;
            document.getElementById('speakingTime').textContent = `${speakingTime} min`;
            document.getElementById('utf8Size').textContent = `${utf8Size} bytes`;
            document.getElementById('utf16Size').textContent = `${utf16Size} bytes`;
            document.getElementById('mostCommonWord').textContent = mostCommonWord;
        }
    } catch (error) {
        console.error('Error calculating statistics:', error);
        resetStats();
    }
}

function resetStats() {
    try {
        const statElements = document.querySelectorAll('.stat-item span');
        statElements.forEach(el => el.textContent = '0');
        document.getElementById('mostCommonWord').textContent = '-';
    } catch (error) {
        console.error('Error resetting statistics:', error);
    }
}

// Debounced stats calculation
function debouncedCalculateStats() {
    if (statsUpdateTimeout) {
        clearTimeout(statsUpdateTimeout);
    }
    
    statsUpdateTimeout = setTimeout(() => {
        calculateStats();
    }, STATS_UPDATE_DELAY);
}

// Event Listeners
editor.addEventListener('input', () => {
    addToHistory(editor.innerText);
    debouncedCalculateStats();
});

editor.addEventListener('keyup', debouncedCalculateStats);
editor.addEventListener('mouseup', debouncedCalculateStats);
editor.addEventListener('select', debouncedCalculateStats);
editor.addEventListener('selectionchange', debouncedCalculateStats);

editor.addEventListener('paste', async (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    // Show loading for large text
    if (text.length > LARGE_TEXT_THRESHOLD) {
        showLoading();
    }
    
    try {
        // Use requestAnimationFrame to prevent UI blocking
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                document.execCommand('insertText', false, text);
                resolve();
            });
        });
        
        // Add to history and update stats after paste
        addToHistory(editor.innerText);
        debouncedCalculateStats();
    } finally {
        if (text.length > LARGE_TEXT_THRESHOLD) {
            hideLoading();
        }
    }
});

undoBtn.addEventListener('click', undo);
downloadTxtBtn.addEventListener('click', downloadText);

showAdvancedStats.addEventListener('change', () => {
    advancedStats.style.display = showAdvancedStats.checked ? 'block' : 'none';
    calculateStats();
});

fullWidthToggle.addEventListener('click', () => {
    editorContainer.classList.toggle('full-width');
    document.querySelector('.container').classList.toggle('full-width');
    const icon = fullWidthToggle.querySelector('i');
    icon.classList.toggle('fa-arrows-alt-h');
    icon.classList.toggle('fa-compress-arrows-alt');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
});

// Copy to clipboard functionality
copyBtn.addEventListener('click', async () => {
    try {
        const text = editor.innerText;
        await navigator.clipboard.writeText(text);
        
        // Show success state
        copyBtn.style.backgroundColor = '#4CAF50';
        
        // Remove success state after animation
        setTimeout(() => {
            copyBtn.style.backgroundColor = '';
        }, 2000);
    } catch (error) {
        console.error('Error copying text:', error);
        alert('Failed to copy text to clipboard. Please try again.');
    }
});

// Initialize
addToHistory(editor.innerText);
updateUndoButton();
calculateStats(); 