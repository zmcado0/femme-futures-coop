/**
 * 🌸 FEMME FUTURES COOPERATIVE - NEWSLETTER WEBSITE
 * 
 * This JavaScript file handles:
 * - Loading newsletters from .docx files
 * - Displaying newsletter cards
 * - Search functionality
 * - Email subscription
 * - Reading full newsletters
 */

// Newsletter data and state
let newsletters = [];
let currentSearch = '';

// DOM elements
let newsletterArchive, searchInput, emailInput, subscribeBtn, loadingState;
let newsletterDetail, mainContent, backBtn, detailTitle, detailDate, detailContent;

// Initialize the website when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    loadNewsletters();
});

/**
 * Get references to DOM elements
 */
function initializeElements() {
    // Main content elements
    newsletterArchive = document.getElementById('newsletterArchive');
    searchInput = document.getElementById('searchInput');
    emailInput = document.getElementById('emailInput');
    subscribeBtn = document.getElementById('subscribeBtn');
    loadingState = document.getElementById('loadingState');
    
    // Detail view elements
    newsletterDetail = document.getElementById('newsletterDetail');
    mainContent = document.getElementById('mainContent');
    backBtn = document.getElementById('backBtn');
    detailTitle = document.getElementById('detailTitle');
    detailDate = document.getElementById('detailDate');
    detailContent = document.getElementById('detailContent');
}

/**
 * Set up event listeners for interactivity
 */
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Email subscription
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', handleSubscription);
    }
    
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSubscription();
            }
        });
    }
    
    // Back button for newsletter detail
    if (backBtn) {
        backBtn.addEventListener('click', showMainContent);
    }
}

/**
 * Load newsletters from the JSON file and .docx files
 */
async function loadNewsletters() {
    try {
        console.log('Loading newsletters...');
        
        // Load the list of newsletter files
        const response = await fetch('newsletters.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Newsletter files found:', data.files);
        
        // Load each newsletter file
        newsletters = [];
        for (const filename of data.files) {
            try {
                const newsletter = await loadDocxFile(filename);
                if (newsletter) {
                    newsletters.push(newsletter);
                }
            } catch (error) {
                console.warn(`Failed to load ${filename}:`, error);
            }
        }
        
        // Sort newsletters by date (newest first)
        newsletters.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('Newsletters loaded:', newsletters.length);
        displayNewsletters();
        
    } catch (error) {
        console.error('Error loading newsletters:', error);
        showErrorState();
    }
}

/**
 * Load and parse a single .docx file
 */
async function loadDocxFile(filename) {
    try {
        console.log(`Loading ${filename}...`);
        
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        // Use mammoth.js to extract text from .docx file
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const content = result.value;
        
        if (!content || content.trim().length === 0) {
            throw new Error('Empty document');
        }
        
        // Create newsletter object
        const newsletter = {
            id: filename.replace(/\.[^/.]+$/, ""), // Remove extension
            title: extractTitle(content, filename),
            content: content,
            excerpt: extractExcerpt(content),
            date: extractDate(content, filename),
            filename: filename
        };
        
        console.log(`Successfully loaded: ${newsletter.title}`);
        return newsletter;
        
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return null;
    }
}

/**
 * Extract title from document content or use filename
 */
function extractTitle(content, filename) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Use first non-empty line as title, or filename as fallback
    if (lines.length > 0) {
        return lines[0].substring(0, 100); // Limit title length
    }
    
    // Clean up filename for title
    return filename
        .replace(/\.[^/.]+$/, "") // Remove extension
        .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
}

/**
 * Extract excerpt from document content
 */
function extractExcerpt(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Skip first line (title) and get next few lines for excerpt
    const excerptLines = lines.slice(1, 4); // Get lines 2-4
    let excerpt = excerptLines.join(' ');
    
    // Limit excerpt length
    if (excerpt.length > 200) {
        excerpt = excerpt.substring(0, 200) + '...';
    }
    
    return excerpt || 'Click to read this newsletter...';
}

/**
 * Extract or generate date for newsletter
 */
function extractDate(content, filename) {
    // Try to find a date in the content
    const dateRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i;
    const dateMatch = content.match(dateRegex);
    
    if (dateMatch) {
        return new Date(dateMatch[0]).toLocaleDateString();
    }
    
    // Fallback to current date
    return new Date().toLocaleDateString();
}

/**
 * Display newsletters in the archive
 */
function displayNewsletters() {
    if (!newsletterArchive) return;
    
    // Hide loading state
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Filter newsletters based on search
    const filteredNewsletters = newsletters.filter(newsletter => 
        newsletter.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
        newsletter.excerpt.toLowerCase().includes(currentSearch.toLowerCase()) ||
        newsletter.content.toLowerCase().includes(currentSearch.toLowerCase())
    );
    
    // Clear existing content
    newsletterArchive.innerHTML = '';
    
    if (filteredNewsletters.length === 0) {
        newsletterArchive.innerHTML = `
            <div class="newsletter-card">
                <h2 class="newsletter-title">No newsletters found</h2>
                <p class="newsletter-excerpt">
                    ${currentSearch ? 'Try a different search term.' : 'No newsletters available yet.'}
                </p>
            </div>
        `;
        return;
    }
    
    // Create newsletter cards
    filteredNewsletters.forEach(newsletter => {
        const card = createNewsletterCard(newsletter);
        newsletterArchive.appendChild(card);
    });
}

/**
 * Create a newsletter card element
 */
function createNewsletterCard(newsletter) {
    const card = document.createElement('div');
    card.className = 'newsletter-card';
    
    card.innerHTML = `
        <div class="newsletter-date">
            <span class="icon">📅</span>
            ${newsletter.date}
        </div>
        <h2 class="newsletter-title">${newsletter.title}</h2>
        <p class="newsletter-excerpt">${newsletter.excerpt}</p>
        <button class="read-more-btn" onclick="showNewsletterDetail('${newsletter.id}')">
            <span class="icon">📖</span>
            Read Full Newsletter
        </button>
    `;
    
    return card;
}

/**
 * Show full newsletter detail
 */
function showNewsletterDetail(newsletterId) {
    const newsletter = newsletters.find(n => n.id === newsletterId);
    if (!newsletter) return;
    
    // Populate detail view
    if (detailTitle) detailTitle.textContent = newsletter.title;
    if (detailDate) detailDate.textContent = newsletter.date;
    if (detailContent) detailContent.textContent = newsletter.content;
    
    // Show detail view, hide main content
    if (newsletterDetail) newsletterDetail.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

/**
 * Show main content, hide newsletter detail
 */
function showMainContent() {
    if (newsletterDetail) newsletterDetail.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

/**
 * Handle search input
 */
function handleSearch(event) {
    currentSearch = event.target.value;
    displayNewsletters();
}

/**
 * Handle email subscription
 */
function handleSubscription() {
    if (!emailInput || !subscribeBtn) return;
    
    const email = emailInput.value.trim();
    
    if (!email) {
        alert('Please enter your email address.');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Simulate subscription (you can integrate with your email service here)
    console.log('Newsletter subscription:', email);
    
    // Show success message
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 5000);
    }
    
    // Clear input
    emailInput.value = '';
    
    // Optional: You can add actual email service integration here
    // For example, with Mailchimp, ConvertKit, or other services
}

/**
 * Validate email address
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show error state when newsletters fail to load
 */
function showErrorState() {
    if (!newsletterArchive) return;
    
    // Hide loading state
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    newsletterArchive.innerHTML = `
        <div class="newsletter-card">
            <h2 class="newsletter-title">⚠️ Unable to Load Newsletters</h2>
            <p class="newsletter-excerpt">
                There was an issue loading the newsletters. Please check that:
            </p>
            <ul style="margin: 1rem 0; padding-left: 2rem; color: #6b7280;">
                <li>The newsletters.json file exists</li>
                <li>The .docx files are in the same folder</li>
                <li>You're running this on a web server (not file://)</li>
            </ul>
            <button class="read-more-btn" onclick="location.reload()">
                <span class="icon">🔄</span>
                Try Again
            </button>
        </div>
    `;
}

/**
 * Utility function to make showNewsletterDetail available globally
 */
window.showNewsletterDetail = showNewsletterDetail;
