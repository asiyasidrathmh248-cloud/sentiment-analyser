/**
 * Sentiment Analyzer - Script Logic
 * Author: Antigravity
 * Description: Rule-based sentiment analysis using word-matching arrays
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Sentiment Word Arrays
    const positiveWords = [
        'happy', 'good', 'excellent', 'amazing', 'wonderful', 'love', 'great', 
        'fantastic', 'awesome', 'nice', 'joy', 'perfect', 'beautiful', 'superb', 
        'glad', 'cheerful', 'pleasant', 'super', 'cool', 'brilliant', 'outstanding',
        'love', 'loved', 'loves', 'loving', 'victory', 'winner', 'success', 'happily'
    ];

    const negativeWords = [
        'bad', 'terrible', 'awful', 'hate', 'sad', 'poor', 'horrible', 'worst', 
        'disappointed', 'angry', 'annoyed', 'gloomy', 'miserable', 'ugly', 'frustrated', 
        'pain', 'broken', 'failure', 'useless', 'dislike', 'worse', 'boring', 'hated',
        'hates', 'hating', 'sadly', 'regret', 'scared', 'fear', 'sorry', 'worried'
    ];

    // 2. DOM Elements Selection
    const textInput = document.getElementById('text-input');
    const charCounter = document.getElementById('char-counter');
    const clearBtn = document.getElementById('clear-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    const resultSection = document.getElementById('result-section');
    const resultCard = document.getElementById('result-card');
    const resultEmoji = document.getElementById('result-emoji');
    const resultLabel = document.getElementById('result-label');
    const resultScore = document.getElementById('result-score');
    
    const sentimentIndicator = document.getElementById('sentiment-indicator');
    
    const posCountEl = document.getElementById('pos-count');
    const posWordListEl = document.getElementById('pos-word-list');
    const negCountEl = document.getElementById('neg-count');
    const negWordListEl = document.getElementById('neg-word-list');
    
    const textHighlightedEl = document.getElementById('text-highlighted');

    // Helper: Escapes string to be safe for Regex construction
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Helper: Escapes string to prevent HTML injection / XSS
    const escapeHTML = (text) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // 3. Live Character Counter
    textInput.addEventListener('input', () => {
        const length = textInput.value.length;
        charCounter.textContent = `${length} / 1000 characters`;
        
        // Hide error message on input if they start typing
        if (length > 0) {
            hideError();
        }
    });

    // 4. Clear Button Handler
    clearBtn.addEventListener('click', () => {
        textInput.value = '';
        charCounter.textContent = '0 / 1000 characters';
        hideError();
        hideResults();
        textInput.focus();
    });

    // 5. Analyze Sentiment Trigger
    analyzeBtn.addEventListener('click', performSentimentAnalysis);

    // Press Ctrl+Enter or Cmd+Enter to analyze too (nice UX shortcut)
    textInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            performSentimentAnalysis();
        }
    });

    // 6. Analysis Engine
    function performSentimentAnalysis() {
        const rawText = textInput.value.trim();

        // Check if empty
        if (!rawText) {
            showError('Please enter some text to analyze.');
            hideResults();
            return;
        }

        hideError();

        // Parse text into individual words for array matching
        // Convert to lowercase and strip out punctuation except inside words (e.g. let's)
        const cleanText = rawText.toLowerCase().replace(/[^\w\s']/g, ' ');
        const words = cleanText.split(/\s+/).filter(w => w.length > 0);

        // Find positive matches
        const matchedPositiveWords = words.filter(word => positiveWords.includes(word));
        // Find negative matches
        const matchedNegativeWords = words.filter(word => negativeWords.includes(word));

        const positiveCount = matchedPositiveWords.length;
        const negativeCount = matchedNegativeWords.length;

        // Determine sentiment score (positive - negative)
        const score = positiveCount - negativeCount;

        // Classify Sentiment
        let sentiment = 'Neutral';
        let emoji = '😐';
        let cardClass = 'sentiment-neutral';
        
        if (positiveCount > negativeCount) {
            sentiment = 'Positive';
            emoji = '😊';
            cardClass = 'sentiment-positive';
        } else if (negativeCount > positiveCount) {
            sentiment = 'Negative';
            emoji = '😢';
            cardClass = 'sentiment-negative';
        }

        // Render Primary Results
        resultEmoji.textContent = emoji;
        resultLabel.textContent = sentiment;
        
        // Format Score with + or - prefix
        if (score > 0) {
            resultScore.textContent = `+${score}`;
        } else {
            resultScore.textContent = `${score}`;
        }

        // Update Theme Color Classes
        resultCard.className = `result-card ${cardClass}`;

        // Update Indicator scale bar (50% is middle/neutral)
        // Adjust indicator position based on score (clamped between 5% and 95%)
        let indicatorLeft = 50;
        if (score > 0) {
            indicatorLeft = Math.min(95, 50 + (score * 8));
        } else if (score < 0) {
            indicatorLeft = Math.max(5, 50 + (score * 8));
        }
        sentimentIndicator.style.left = `${indicatorLeft}%`;

        // Render Matches Breakdown Lists
        renderWordTags(matchedPositiveWords, posCountEl, posWordListEl, 'positive-tag');
        renderWordTags(matchedNegativeWords, negCountEl, negWordListEl, 'negative-tag');

        // Render Highlighted Preview
        renderHighlightedText(rawText);

        // Show result card section
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 7. Render Word Tag Elements (Remove Duplicates for Tags view)
    function renderWordTags(wordsList, countContainer, listContainer, badgeClass) {
        countContainer.textContent = wordsList.length;

        if (wordsList.length === 0) {
            listContainer.textContent = 'None';
            return;
        }

        // De-duplicate words for clean badges
        const uniqueWords = [...new Set(wordsList)];
        listContainer.innerHTML = '';

        uniqueWords.forEach(word => {
            // Count occurrences of this specific word in the original list
            const occurrences = wordsList.filter(w => w === word).length;
            const countSuffix = occurrences > 1 ? ` (x${occurrences})` : '';

            const span = document.createElement('span');
            span.className = `word-tag ${badgeClass}`;
            span.textContent = `${word}${countSuffix}`;
            listContainer.appendChild(span);
        });
    }

    // 8. Render Highlighted Text Preview
    function renderHighlightedText(text) {
        let escapedHTML = escapeHTML(text);

        // We want to highlight matches but keep capitalization.
        // We'll construct regexes matching positive and negative words on word boundaries.
        if (positiveWords.length > 0) {
            const posRegex = new RegExp(`\\b(${positiveWords.map(escapeRegex).join('|')})\\b`, 'gi');
            escapedHTML = escapedHTML.replace(posRegex, '<span class="highlight-positive">$&</span>');
        }

        if (negativeWords.length > 0) {
            const negRegex = new RegExp(`\\b(${negativeWords.map(escapeRegex).join('|')})\\b`, 'gi');
            escapedHTML = escapedHTML.replace(negRegex, '<span class="highlight-negative">$&</span>');
        }

        textHighlightedEl.innerHTML = escapedHTML;
    }

    // 9. Utility UI Functions
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.add('show');
    }

    function hideError() {
        errorMessage.classList.remove('show');
    }

    function hideResults() {
        resultSection.classList.add('hidden');
    }
});
