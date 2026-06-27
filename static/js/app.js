// Global State
let newsArticles = [];
let selectedArticleId = null;
let activeCategory = 'all';
let searchQuery = '';

// DOM Elements
const newsFeed = document.getElementById('newsFeed');
const refreshBtn = document.getElementById('refreshBtn');
const btnText = document.getElementById('btnText');
const refreshIcon = document.getElementById('refreshIcon');
const statusMessage = document.getElementById('statusMessage');

// Metrics Elements
const countTotal = document.getElementById('countTotal');
const countAgentic = document.getElementById('countAgentic');
const countCurated = document.getElementById('countCurated');

// Filter Elements
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');

// Composer Elements
const composerEmptyState = document.getElementById('composerEmptyState');
const selectedArticlePreview = document.getElementById('selectedArticlePreview');
const tweetFormGroup = document.getElementById('tweetFormGroup');
const composerActions = document.getElementById('composerActions');

const previewBadge = document.getElementById('previewBadge');
const previewTitle = document.getElementById('previewTitle');
const previewMeta = document.getElementById('previewMeta');

const tweetText = document.getElementById('tweetText');
const charCount = document.getElementById('charCount');
const charProgress = document.getElementById('charProgress');
const tweetBtn = document.getElementById('tweetBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh feed
    refreshBtn.addEventListener('click', fetchNews);

    // Search input filtering
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });

    // Category button filtering
    categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            // Remove active class from all
            document.querySelectorAll('.tab-btn').forEach(tag => tag.classList.remove('active'));
            // Add active class to clicked
            e.target.classList.add('active');
            
            activeCategory = e.target.dataset.category;
            renderFeed();
        }
    });

    // Custom text input character tracking
    tweetText.addEventListener('input', updateCharCount);

    // Clear selection handler
    clearSelectionBtn.addEventListener('click', clearSelection);
}

// Fetch News API call
async function fetchNews() {
    // Show loading state
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/news');
        const data = await response.json();
        
        if (data.status === 'success' && data.news) {
            newsArticles = data.news;
            updateMetrics();
            renderFeed();
            
            // Update last updated message
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            statusMessage.textContent = `Updated at ${timeStr}`;
            statusMessage.classList.remove('syncing');
        } else {
            throw new Error('Failed to retrieve news data');
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        statusMessage.textContent = 'Failed to sync news feed';
        statusMessage.classList.remove('syncing');
        newsFeed.innerHTML = `
            <div class="feed-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h3>Error Syncing News</h3>
                <p>Could not retrieve latest SAP updates. Please try refreshing again in a few moments.</p>
            </div>
        `;
    } finally {
        setLoadingState(false);
    }
}

// Helper to set Loading animation state
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshIcon.classList.add('spin');
        btnText.textContent = 'Syncing...';
        statusMessage.textContent = 'Syncing with SAP News...';
        statusMessage.classList.add('syncing');
        refreshBtn.disabled = true;
        
        // Show skeleton loader
        newsFeed.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        `;
    } else {
        refreshIcon.classList.remove('spin');
        btnText.textContent = 'Refresh Feed';
        refreshBtn.disabled = false;
    }
}

// Update Top Metrics Panels
function updateMetrics() {
    countTotal.textContent = newsArticles.length;
    
    // Count agentic updates (containing Agent, Agentic, Joule, Autonomous)
    const agenticCount = newsArticles.filter(art => {
        const text = `${art.title} ${art.description}`.toLowerCase();
        return text.includes('agent') || text.includes('joule') || text.includes('autonomous');
    }).length;
    countAgentic.textContent = agenticCount;
    
    // Count curated
    const curatedCount = newsArticles.filter(art => art.is_curated).length;
    countCurated.textContent = curatedCount;
}

// Update category filter counts dynamically based on search query
function updateCategoryCounts() {
    const buttons = document.querySelectorAll('#categoryFilters .tab-btn');
    buttons.forEach(btn => {
        const category = btn.dataset.category;
        
        // Count how many matching articles in this category fit the search query
        const count = newsArticles.filter(art => {
            const text = `${art.title} ${art.description} ${art.tags.join(' ')}`.toLowerCase();
            const matchesSearch = text.includes(searchQuery);
            if (!matchesSearch) return false;
            
            if (category === 'all') return true;
            return art.category.toLowerCase() === category.toLowerCase();
        }).length;
        
        let label = "";
        if (category === 'all') label = "All Updates";
        else if (category === 'Agentic AI') label = "Agentic AI";
        else if (category === 'Developer Tools') label = "Developer Tools";
        else if (category === 'Partnerships') label = "Partnerships";
        else if (category === 'Business AI') label = "Business AI";
        else label = category;
        
        btn.innerHTML = `${label} <span class="tab-count">${count}</span>`;
    });
}

// Render News Feed Items
function renderFeed() {
    // Update tabs count
    updateCategoryCounts();

    // Filter articles
    const filteredArticles = newsArticles.filter(art => {
        // Category Filter
        const matchesCategory = activeCategory === 'all' || 
            art.category.toLowerCase() === activeCategory.toLowerCase();
            
        // Search Filter
        const text = `${art.title} ${art.description} ${art.tags.join(' ')}`.toLowerCase();
        const matchesSearch = text.includes(searchQuery);
        
        return matchesCategory && matchesSearch;
    });

    // Check if empty
    if (filteredArticles.length === 0) {
        newsFeed.innerHTML = `
            <div class="feed-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <h3>No Matching Articles Found</h3>
                <p>Try modifying your search keywords or choosing a different category filter.</p>
            </div>
        `;
        return;
    }

    // Build feed HTML
    newsFeed.innerHTML = filteredArticles.map(art => {
        const isSelected = art.id === selectedArticleId;
        const tagHTML = art.tags.map(tag => `<span class="news-card-tag">#${tag}</span>`).join('');
        
        return `
            <div class="news-card ${isSelected ? 'selected' : ''}" data-id="${art.id}" onclick="handleCardSelect('${art.id}')">
                <div class="news-card-content">
                    <div class="news-card-header">
                        <div class="badge-and-source">
                            <span class="category-badge">${art.category}</span>
                            <span class="source-badge">${art.is_curated ? 'Insight' : 'Press Feed'}</span>
                        </div>
                        <span class="news-card-date">${art.published}</span>
                    </div>
                    <h3>${art.title}</h3>
                    <p class="news-card-description">${art.description}</p>
                    <div class="news-card-footer">
                        <div class="news-card-tags">
                            ${tagHTML}
                        </div>
                        <a href="${art.link}" target="_blank" class="btn-read-more" onclick="event.stopPropagation();">
                            Read Original
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                                <polyline points="12 5 19 12 12 19"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Handle Card Selection
function handleCardSelect(id) {
    if (selectedArticleId === id) {
        // Toggle off if clicking the already selected card
        clearSelection();
    } else {
        selectedArticleId = id;
        renderFeed(); // Re-render feed to apply class and tick checkmark
        updateComposer();
    }
}

// Update Composer Panels
function updateComposer() {
    const article = newsArticles.find(art => art.id === selectedArticleId);
    if (!article) {
        clearSelection();
        return;
    }

    // Hide empty state, show panels
    composerEmptyState.style.display = 'none';
    selectedArticlePreview.style.display = 'block';
    tweetFormGroup.style.display = 'block';
    composerActions.style.display = 'flex';

    // Populate preview
    previewBadge.textContent = article.category;
    previewTitle.textContent = article.title;
    previewMeta.textContent = `Published: ${article.published}`;

    // Generate Tweet text template
    generateDefaultTweet(article);
}

// Generate the Default Tweet String and limit to 280 chars
function generateDefaultTweet(article) {
    const headline = `📰 SAP AI: ${article.title}`;
    const hashtags = `\n\n#SAP #AgenticAI #Joule`;
    const link = ` ${article.link}`;
    
    // Total character budget for description
    const metaLength = headline.length + hashtags.length + link.length;
    const descBudget = 280 - metaLength;
    
    let description = article.description;
    if (description.length > descBudget) {
        // Truncate description to fit budget and add ellipsis
        description = description.substring(0, descBudget - 3) + '...';
    }

    const defaultTweet = `${headline}\n\n"${description}"${hashtags}${link}`;
    tweetText.value = defaultTweet;
    updateCharCount();
}

// Update Character Tracker & Progress bar
function updateCharCount() {
    const currentLength = tweetText.value.length;
    const remaining = 280 - currentLength;
    
    charCount.textContent = `${remaining} characters remaining`;
    
    // Progress calculation
    const progressPercent = Math.min((currentLength / 280) * 100, 100);
    charProgress.style.width = `${progressPercent}%`;
    
    // Bind Tweet text to the anchor href dynamically (prevents popup blockers)
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText.value)}`;
    tweetBtn.href = intentUrl;
    
    // Apply styling based on remaining character budget
    if (remaining < 0) {
        charCount.style.color = '#ef4444'; // Red
        charProgress.style.backgroundColor = '#ef4444';
        tweetBtn.style.pointerEvents = 'none'; // Disable click action
        tweetBtn.style.opacity = '0.5';
    } else if (remaining < 30) {
        charCount.style.color = '#f59e0b'; // Yellow/Orange
        charProgress.style.backgroundColor = '#f59e0b';
        tweetBtn.style.pointerEvents = 'auto'; // Enable click action
        tweetBtn.style.opacity = '1';
    } else {
        charCount.style.color = 'var(--text-secondary)';
        charProgress.style.backgroundColor = 'var(--accent-teal)';
        tweetBtn.style.pointerEvents = 'auto'; // Enable click action
        tweetBtn.style.opacity = '1';
    }
}

// Clear selected state and reset composer panels
function clearSelection() {
    selectedArticleId = null;
    renderFeed();

    // Reset Composer view
    composerEmptyState.style.display = 'flex';
    selectedArticlePreview.style.display = 'none';
    tweetFormGroup.style.display = 'none';
    composerActions.style.display = 'none';
    
    tweetText.value = '';
}
