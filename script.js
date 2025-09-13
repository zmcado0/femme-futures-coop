/**
 * 🌸 FEMME FUTURES COOPERATIVE NEWSLETTER WEBSITE
 * 
 * This file makes your website work! Here's what it does:
 * ✅ Loads newsletter files from the Newsletters folder
 * ✅ Shows them as cards on your homepage
 * ✅ Handles search, admin panel, and subscriptions
 * 
 * 🔧 BEGINNER-FRIENDLY: You don't need to understand this code to use the website!
 * 📝 TO ADD NEWSLETTERS: Just put .docx files in the Newsletters folder and run the script
 */

// =====================================
// 📊 WEBSITE DATA STORAGE
// =====================================
// These variables store all the information for your website
let newsletters = [];           // 📰 Stores all your newsletter data
let subscribers = [];          // 👥 Stores email subscribers  
let filteredNewsletters = [];  // 🔍 Stores search results

// =====================================
// ⚙️ WEBSITE CONFIGURATION
// =====================================
// AUTOMATIC MODE: The website finds all .docx files automatically
// MANUAL MODE: List specific files here if you want control
const newsletterFiles = [
    // 🤖 LEAVE THIS EMPTY for automatic detection
    // 📝 OR add files manually like: "My Newsletter.docx",
];

// =====================================
// 🎯 WEBSITE ELEMENTS (Don't change these!)
// =====================================
// This finds all the important parts of your webpage
const websiteElements = {};

function findWebsiteElements() {
    console.log('🔍 Finding website elements...');
    
    const importantElements = [
        'mainContent', 'newsletterDetail', 'backBtn', 'searchInput', 
        'newsletterArchive', 'emailInput', 'subscribeBtn', 'successMessage',
        'detailTitle', 'detailDate', 'detailContent'
    ];
    
    importantElements.forEach(elementName => {
        websiteElements[elementName] = document.getElementById(elementName);
    });
    
    console.log('✅ Found all website elements!');
}

// =====================================
// 🚀 START THE WEBSITE
// =====================================
// This runs when the webpage loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌸 Welcome to Femme Futures Cooperative Website!');
    console.log('🚀 Starting website...');
    
    // Step 1: Find all the webpage elements
    findWebsiteElements();
    
    // Step 2: Check if the library for reading Word documents loaded
    if (!window.mammoth) {
        console.error('❌ Cannot read .docx files! Check your internet connection.');
        showErrorMessage('internet');
        return;
    }
    console.log('✅ Word document reader loaded successfully!');
    
    // Step 3: Load all your newsletters
    await loadAllNewsletters();
    
    // Step 4: Show newsletters on the page
    displayNewsletters();
    updateSubscriberCount();
    
    // Step 5: Make buttons and forms work
    setupAllButtonClicks();
    
    console.log('🎉 Website is ready! Everything is working.');
});

// =====================================
// 📰 NEWSLETTER LOADING FUNCTIONS
// =====================================

async function loadAllNewsletters() {
    console.log('📂 Looking for newsletters...');
    
    try {
        // Get list of newsletter files
        let filesToLoad = newsletterFiles.filter(filename => filename.trim());
        
        // If no files listed manually, try to find them automatically
        if (filesToLoad.length === 0) {
            console.log('🤖 No manual files listed. Trying automatic detection...');
            filesToLoad = await findNewslettersAutomatically();
        }
        
        console.log('📄 Files to load:', filesToLoad);
        
        // If still no files found, show helpful message
        if (filesToLoad.length === 0) {
            console.log('⚠️ No newsletter files found');
            showErrorMessage('nofiles');
            return;
        }
        
        // Load and read all the newsletter files
        await loadAndReadFiles(filesToLoad);
        
    } catch (error) {
        console.error('❌ Error loading newsletters:', error);
        showErrorMessage('loading');
    }
}

async function findNewslettersAutomatically() {
    try {
        console.log('📡 Checking newsletters.json file...');
        const response = await fetch('newsletters.json');
        const data = await response.json();
        
        if (data.files && data.files.length > 0) {
            console.log('✅ Found newsletters automatically:', data.files);
            return data.files;
        }
    } catch (error) {
        console.log('⚠️ Automatic detection failed. That\'s okay!');
    }
    return [];
}

async function loadAndReadFiles(fileNames) {
    console.log('📥 Loading newsletter files...');
    
    // Create a promise for each file (loads them all at once for speed)
    const fileLoadingPromises = fileNames.map(async (filename, index) => {
        try {
            console.log(`📄 Loading: ${filename}`);
            
            // Download the file from the Newsletters folder
            const response = await fetch(`Newsletters/${filename}`);
            
            if (!response.ok) {
                console.warn(`⚠️ Could not load: ${filename}`);
                return null;
            }
            
            // Convert the file to a format we can read
            const fileData = await response.arrayBuffer();
            
            // Read the contents of the Word document
            return readWordDocument(fileData, index + 1, filename);
            
        } catch (error) {
            console.warn(`❌ Error with ${filename}:`, error);
            return null;
        }
    });
    
    // Wait for all files to finish loading
    const loadedNewsletters = await Promise.all(fileLoadingPromises);
    
    // Keep only the newsletters that loaded successfully
    newsletters = loadedNewsletters
        .filter(newsletter => newsletter !== null)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
        
    filteredNewsletters = [...newsletters];
    
    if (newsletters.length === 0) {
        showErrorMessage('nofiles');
    } else {
        console.log(`🎉 Successfully loaded ${newsletters.length} newsletters!`);
    }
}

// =====================================
// 📖 READING WORD DOCUMENTS
// =====================================

async function readWordDocument(fileData, id, filename) {
    try {
        console.log(`📖 Reading contents of: ${filename}`);
        
        // Use the mammoth library to read the Word document
        const result = await window.mammoth.extractRawText({ arrayBuffer: fileData });
        const documentText = result.value;
        
        if (!documentText.trim()) {
            console.warn(`⚠️ File appears to be empty: ${filename}`);
            return null;
        }
        
        // Split the document into lines for processing
        const lines = documentText.split('\n').filter(line => line.trim());
        
        // Create a newsletter object with all the information
        return {
            id: id,
            title: findNewsletterTitle(lines, filename),
            date: findNewsletterDate(filename) || getTodayDate(),
            excerpt: findNewsletterExcerpt(lines),
            content: cleanUpText(documentText)
        };
        
    } catch (error) {
        console.error(`❌ Error reading ${filename}:`, error);
        return null;
    }
}

function findNewsletterTitle(lines, filename) {
    // Look for a good line to use as the title
    for (let line of lines) {
        const cleanLine = line.trim();
        // Good title: not too short, not too long
        if (cleanLine.length > 10 && cleanLine.length < 150) {
            // Clean up the title (remove numbers and weird characters)
            return cleanLine.replace(/^\d+\.\s*/, '').replace(/^[^\w]*/, '');
        }
    }
    
    // If no good title found, use the filename
    return filename.replace(/\.docx$/, '').replace(/_/g, ' ').replace(/^\d{4}-\d{2}-\d{2}\s*/, '');
}

function findNewsletterExcerpt(lines) {
    // Look for a good paragraph to use as preview text
    for (let line of lines) {
        const cleanLine = line.trim();
        // Good excerpt: longer than 50 characters, shorter than 300
        if (cleanLine.length > 50 && cleanLine.length < 300) {
            return cleanLine.substring(0, 200) + (cleanLine.length > 200 ? '...' : '');
        }
    }
    
    // If no good excerpt found, use first 200 characters
    const allText = lines.join(' ').trim();
    return allText.substring(0, 200) + (allText.length > 200 ? '...' : '');
}

function cleanUpText(text) {
    // Clean up the text for better display
    return text
        .split('\n')                    // Split into lines
        .map(line => line.trim())       // Remove extra spaces
        .filter(line => line.length > 0) // Remove empty lines
        .join('\n\n');                  // Add back with double line breaks
}

function findNewsletterDate(filename) {
    // Look for dates in the filename like "2024-08-22"
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// =====================================
// 🎨 SHOWING NEWSLETTERS ON THE PAGE
// =====================================

function displayNewsletters() {
    console.log('🎨 Displaying newsletters on the page...');
    
    // Remove loading message
    removeLoadingMessage();
    
    // Clear the newsletter area
    websiteElements.newsletterArchive.innerHTML = '';
    
    // If no newsletters, show helpful message
    if (filteredNewsletters.length === 0) {
        showErrorMessage('nofiles');
        return;
    }
    
    // Create a card for each newsletter
    filteredNewsletters.forEach(newsletter => {
        const newsletterCard = createNewsletterCard(newsletter);
        websiteElements.newsletterArchive.appendChild(newsletterCard);
    });
    
    // Make the cards clickable
    makeNewsletterCardsClickable();
    
    console.log('✅ Newsletters displayed successfully!');
}

function createNewsletterCard(newsletter) {
    const card = document.createElement('article');
    card.className = 'newsletter-card';
    card.innerHTML = `
        <div class="newsletter-date">
            <span class="icon">📅</span>
            ${formatDateNicely(newsletter.date)}
        </div>
        <h2 class="newsletter-title" data-id="${newsletter.id}">
            ${newsletter.title}
        </h2>
        <p class="newsletter-excerpt">${newsletter.excerpt}</p>
        <button class="read-more-btn" data-id="${newsletter.id}">
            Read more →
        </button>
    `;
    return card;
}

function makeNewsletterCardsClickable() {
    // Find all newsletter titles and read-more buttons
    document.querySelectorAll('.newsletter-title, .read-more-btn').forEach(element => {
        element.addEventListener('click', function() {
            const newsletterId = parseInt(this.getAttribute('data-id'));
            const newsletter = newsletters.find(n => n.id === newsletterId);
            if (newsletter) {
                showFullNewsletter(newsletter);
            }
        });
    });
}

// =====================================
// 📱 WEBSITE NAVIGATION
// =====================================

function showFullNewsletter(newsletter) {
    websiteElements.mainContent.classList.add('hidden');
    websiteElements.newsletterDetail.classList.remove('hidden');
    
    // Fill in the newsletter details
    websiteElements.detailTitle.textContent = newsletter.title;
    websiteElements.detailDate.textContent = formatDateNicely(newsletter.date);
    websiteElements.detailContent.innerHTML = formatNewsletterContent(newsletter.content);
}

function hideFullNewsletter() {
    websiteElements.newsletterDetail.classList.add('hidden');
    websiteElements.mainContent.classList.remove('hidden');
}

// =====================================
// 🔍 SEARCH FUNCTIONALITY
// =====================================

function handleSearch(searchEvent) {
    const searchWords = searchEvent.target.value.toLowerCase();
    
    // Filter newsletters based on search
    filteredNewsletters = newsletters.filter(newsletter =>
        newsletter.title.toLowerCase().includes(searchWords) ||
        newsletter.content.toLowerCase().includes(searchWords)
    );
    
    // Show the filtered results
    displayNewsletters();
}

// =====================================
// 📧 EMAIL SUBSCRIPTION
// =====================================

function handleEmailSignup() {
    const email = websiteElements.emailInput.value.trim();
    
    // Basic email validation
    if (email && email.includes('@')) {
        // Add to subscriber list
        subscribers.push({
            email: email,
            date: getTodayDate()
        });
        
        // Clear the input
        websiteElements.emailInput.value = '';
        
        // Show success message
        showSuccessMessage();
        updateSubscriberCount();
        displaySubscriberList();
    }
}

function showSuccessMessage() {
    websiteElements.successMessage.classList.remove('hidden');
    setTimeout(() => {
        websiteElements.successMessage.classList.add('hidden');
    }, 3000);
}

function updateSubscriberCount() {
    websiteElements.subscriberTitle.textContent = `Subscribers (${subscribers.length})`;
}

function displaySubscriberList() {
    websiteElements.subscriberList.innerHTML = '';
    
    if (subscribers.length === 0) {
        websiteElements.subscriberList.innerHTML = '<p class="no-subscribers">No subscribers yet.</p>';
        return;
    }
    
    subscribers.forEach(subscriber => {
        const item = document.createElement('div');
        item.className = 'subscriber-item';
        item.innerHTML = `
            <div class="subscriber-email">
                <span class="icon">👤</span>
                ${subscriber.email}
            </div>
            <span class="subscriber-date">${subscriber.date}</span>
        `;
        websiteElements.subscriberList.appendChild(item);
    });
}

// =====================================
// 👨‍💼 ADMIN FUNCTIONS - REMOVED FOR SIMPLICITY
// =====================================
// Admin features have been removed to keep the codebase simple
// These can be added back as future enhancements

// =====================================
// 🔧 UTILITY FUNCTIONS
// =====================================

function formatDateNicely(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatNewsletterContent(content) {
    return content
        .split('\n')
        .map(paragraph => {
            // Format bold text
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return `<h3>${paragraph.slice(2, -2)}</h3>`;
            }
            // Skip empty paragraphs
            if (paragraph.trim() === '') {
                return '<br>';
            }
            // Regular paragraphs
            return `<p>${paragraph}</p>`;
        })
        .join('');
}

function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loadingState');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// =====================================
// ⚠️ ERROR MESSAGES
// =====================================

function showErrorMessage(errorType) {
    removeLoadingMessage();
    
    let message = '';
    
    if (errorType === 'internet') {
        message = `
            <div class="newsletter-card">
                <h2 class="newsletter-title">⚠️ Internet Connection Problem</h2>
                <p class="newsletter-excerpt">
                    Can't load the Word document reader. Please check your internet connection and refresh the page.
                </p>
            </div>
        `;
    } else if (errorType === 'nofiles') {
        message = `
            <div class="newsletter-card">
                <h2 class="newsletter-title">📂 No Newsletters Yet</h2>
                <p class="newsletter-excerpt">
                    <strong>To add newsletters:</strong><br>
                    1. Put your .docx files in the "Newsletters" folder<br>
                    2. Run the update script: <code>./generate-newsletter-list.sh</code><br>
                    3. Upload both files to GitHub<br>
                    4. Your newsletters will appear here!
                </p>
                <p class="newsletter-excerpt">
                    <strong>Need help?</strong> Check the README.md file for step-by-step instructions.
                </p>
            </div>
        `;
    } else {
        message = `
            <div class="newsletter-card">
                <h2 class="newsletter-title">❌ Something Went Wrong</h2>
                <p class="newsletter-excerpt">
                    There was a problem loading your newsletters. Try refreshing the page, or check the README.md file for help.
                </p>
            </div>
        `;
    }
    
    websiteElements.newsletterArchive.innerHTML = message;
}

// =====================================
// 🎯 BUTTON CLICK SETUP
// =====================================

function setupAllButtonClicks() {
    console.log('🎯 Setting up button clicks...');
    
    // Main navigation buttons
    websiteElements.backBtn.addEventListener('click', hideFullNewsletter);
    
    // Search and subscription
    websiteElements.searchInput.addEventListener('input', handleSearch);
    websiteElements.subscribeBtn.addEventListener('click', handleEmailSignup);
    
    console.log('✅ All buttons are working!');
}

// =====================================
// 🎉 THAT'S IT!
// =====================================
// The website is now ready to use!
// To add newsletters: Put .docx files in the Newsletters folder and run the script