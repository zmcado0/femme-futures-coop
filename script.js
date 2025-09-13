/**
 * 🌸 MANUAL FILE MANAGEMENT VERSION - FIXED
 * 
 * This version is optimized for manually adding files to newsletters.json
 * 
 * ✅ Better error handling and debugging
 * ✅ CORS-friendly file loading
 * ✅ Clear error messages
 * ✅ Fallback for when .docx files can't load
 */

// =====================================
// 📊 WEBSITE DATA STORAGE
// =====================================
let newsletters = [];
let subscribers = [];
let filteredNewsletters = [];

// =====================================
// 🎯 WEBSITE ELEMENTS
// =====================================
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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌸 Starting Femme Futures Website...');
    console.log('📍 Current URL:', window.location.href);
    
    // Step 1: Find webpage elements
    findWebsiteElements();
    
    // Step 2: Check if mammoth library loaded
    if (!window.mammoth) {
        console.error('❌ Mammoth library not loaded!');
        showErrorMessage('library');
        return;
    }
    console.log('✅ Mammoth library loaded successfully!');
    
    // Step 3: Load newsletters
    await loadNewslettersManually();
    
    // Step 4: Display everything
    displayNewsletters();
    setupAllButtonClicks();
    
    console.log('🎉 Website setup complete!');
});

// =====================================
// 📰 MANUAL NEWSLETTER LOADING
// =====================================
async function loadNewslettersManually() {
    console.log('📂 Loading newsletters manually from newsletters.json...');
    
    try {
        // Step 1: Load the newsletters.json file
        console.log('📡 Fetching newsletters.json...');
        const response = await fetch('newsletters.json');
        
        if (!response.ok) {
            console.error('❌ Could not load newsletters.json:', response.status, response.statusText);
            showErrorMessage('json');
            return;
        }
        
        const data = await response.json();
        console.log('✅ newsletters.json loaded:', data);
        
        if (!data.files || data.files.length === 0) {
            console.log('⚠️ No files listed in newsletters.json');
            showErrorMessage('nofiles');
            return;
        }
        
        // Step 2: Try to load each .docx file
        console.log(`📄 Found ${data.files.length} files to load:`, data.files);
        
        const loadingPromises = data.files.map(async (filename, index) => {
            console.log(`📥 Loading file ${index + 1}: ${filename}`);
            return await loadSingleNewsletter(filename, index + 1);
        });
        
        // Wait for all files to load
        const loadedNewsletters = await Promise.all(loadingPromises);
        
        // Filter out failed loads
        newsletters = loadedNewsletters
            .filter(newsletter => newsletter !== null)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
            
        filteredNewsletters = [...newsletters];
        
        console.log(`🎉 Successfully loaded ${newsletters.length} out of ${data.files.length} newsletters`);
        
        if (newsletters.length === 0) {
            showErrorMessage('loading');
        }
        
    } catch (error) {
        console.error('❌ Error in loadNewslettersManually:', error);
        showErrorMessage('loading');
    }
}

async function loadSingleNewsletter(filename, id) {
    try {
        console.log(`🔍 Attempting to load: Newsletters/${filename}`);
        
        // Try to fetch the file
        const response = await fetch(`Newsletters/${filename}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log(`📊 Response for ${filename}:`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
            console.error(`❌ Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
            
            // Create a placeholder newsletter if file can't be loaded
            return createPlaceholderNewsletter(filename, id);
        }
        
        // Try to read as ArrayBuffer
        console.log(`📖 Reading ${filename} as ArrayBuffer...`);
        const fileData = await response.arrayBuffer();
        
        if (!fileData || fileData.byteLength === 0) {
            console.error(`❌ ${filename} is empty or corrupted`);
            return createPlaceholderNewsletter(filename, id);
        }
        
        console.log(`📏 ${filename} size: ${fileData.byteLength} bytes`);
        
        // Try to extract text using mammoth
        console.log(`🔍 Extracting text from ${filename}...`);
        const result = await window.mammoth.extractRawText({ arrayBuffer: fileData });
        
        if (!result || !result.value) {
            console.error(`❌ Could not extract text from ${filename}`);
            return createPlaceholderNewsletter(filename, id);
        }
        
        const documentText = result.value.trim();
        
        if (documentText.length === 0) {
            console.error(`❌ ${filename} appears to be empty`);
            return createPlaceholderNewsletter(filename, id);
        }
        
        console.log(`✅ Successfully extracted ${documentText.length} characters from ${filename}`);
        
        // Create newsletter object
        return createNewsletterFromText(documentText, filename, id);
        
    } catch (error) {
        console.error(`❌ Error loading ${filename}:`, error);
        return createPlaceholderNewsletter(filename, id);
    }
}

function createPlaceholderNewsletter(filename, id) {
    console.log(`📋 Creating placeholder for ${filename}`);
    
    return {
        id: id,
        title: filename.replace(/\.docx$/, '').replace(/_/g, ' '),
        date: getTodayDate(),
        excerpt: `This newsletter file exists but couldn't be loaded. This might be due to CORS restrictions on GitHub Pages. Try uploading the file again or check the browser console for detailed error messages.`,
        content: `# ${filename.replace(/\.docx$/, '')}\n\nThis newsletter couldn't be loaded automatically. The file exists in your repository but there was an issue reading its contents.\n\n**Possible solutions:**\n1. Re-upload the .docx file\n2. Check file permissions\n3. Verify the file isn't corrupted\n4. Check browser console for detailed errors`,
        placeholder: true
    };
}

function createNewsletterFromText(documentText, filename, id) {
    const lines = documentText.split('\n').filter(line => line.trim());
    
    return {
        id: id,
        title: findNewsletterTitle(lines, filename),
        date: findNewsletterDate(filename) || getTodayDate(),
        excerpt: findNewsletterExcerpt(lines),
        content: cleanUpText(documentText),
        placeholder: false
    };
}

// =====================================
// 📖 TEXT PROCESSING FUNCTIONS
// =====================================
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
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n');
}

function findNewsletterDate(filename) {
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// =====================================
// 🎨 DISPLAY FUNCTIONS
// =====================================
function displayNewsletters() {
    console.log('🎨 Displaying newsletters...');
    
    removeLoadingMessage();
    websiteElements.newsletterArchive.innerHTML = '';
    
    if (filteredNewsletters.length === 0) {
        showErrorMessage('nofiles');
        return;
    }
    
    filteredNewsletters.forEach(newsletter => {
        const card = createNewsletterCard(newsletter);
        websiteElements.newsletterArchive.appendChild(card);
    });
    
    makeNewsletterCardsClickable();
    console.log('✅ Newsletters displayed successfully!');
}

function createNewsletterCard(newsletter) {
    const card = document.createElement('article');
    card.className = 'newsletter-card';
    
    // Add visual indicator for placeholder newsletters
    const placeholderIcon = newsletter.placeholder ? ' ⚠️' : '';
    
    card.innerHTML = `
        <div class="newsletter-date">
            <span class="icon">📅</span>
            ${formatDateNicely(newsletter.date)}
        </div>
        <h2 class="newsletter-title" data-id="${newsletter.id}">
            ${newsletter.title}${placeholderIcon}
        </h2>
        <p class="newsletter-excerpt">${newsletter.excerpt}</p>
        <button class="read-more-btn" data-id="${newsletter.id}">
            Read more →
        </button>
    `;
    return card;
}

function makeNewsletterCardsClickable() {
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
// 📱 NAVIGATION
// =====================================
function showFullNewsletter(newsletter) {
    websiteElements.mainContent.classList.add('hidden');
    websiteElements.newsletterDetail.classList.remove('hidden');
    
    websiteElements.detailTitle.textContent = newsletter.title;
    websiteElements.detailDate.textContent = formatDateNicely(newsletter.date);
    websiteElements.detailContent.innerHTML = formatNewsletterContent(newsletter.content);
}

function hideFullNewsletter() {
    websiteElements.newsletterDetail.classList.add('hidden');
    websiteElements.mainContent.classList.remove('hidden');
}

// =====================================
// 🔍 SEARCH
// =====================================
function handleSearch(searchEvent) {
    const searchWords = searchEvent.target.value.toLowerCase();
    
    filteredNewsletters = newsletters.filter(newsletter =>
        newsletter.title.toLowerCase().includes(searchWords) ||
        newsletter.content.toLowerCase().includes(searchWords)
    );
    
    displayNewsletters();
}

// =====================================
// 📧 EMAIL SUBSCRIPTION
// =====================================
function handleEmailSignup() {
    const email = websiteElements.emailInput.value.trim();
    
    if (email && email.includes('@')) {
        subscribers.push({
            email: email,
            date: getTodayDate()
        });
        
        websiteElements.emailInput.value = '';
        showSuccessMessage();
    }
}

function showSuccessMessage() {
    websiteElements.successMessage.classList.remove('hidden');
    setTimeout(() => {
        websiteElements.successMessage.classList.add('hidden');
    }, 3000);
}

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
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return `<h3>${paragraph.slice(2, -2)}</h3>`;
            }
            if (paragraph.trim() === '') {
                return '<br>';
            }
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
    
    if (errorType === 'library') {
        message = `
            <div class="newsletter-card">
                <h2 class="newsletter-title">⚠️ Library Loading Problem</h2>
                <p class="newsletter-excerpt">
                    The Mammoth library (for reading Word documents) didn't load properly. 
                    Check your internet connection and refresh the page.
                </p>
            </div>
        `;
    } else if (errorType === 'json') {
        message = `
            <div class="newsletter-card">
                <h2 class="newsletter-title">❌ newsletters.json Not Found</h2>
                <p class="newsletter-excerpt">
                    Could not load the newsletters.json file. Make sure:
                    <br>1. The file exists in your repository root
                    <br>2. It has proper JSON syntax: {"files": ["filename.docx"]}
                    <br>3. Your GitHub Pages is working
                </p>
            </div>
        `;
    } else if (errorType === 'nofiles') {
        message = `
            <div class="newsletter-card">
                <h2 class="newsletter-title">📂 No Newsletter Files Listed</h2>
                <p class="newsletter-excerpt">
                    <strong>To add newsletters manually:</strong><br>
                    1. Upload your .docx files to the "Newsletters" folder on GitHub<br>
                    2. Edit newsletters.json to include the filenames<br>
                    3. Example: {"files": ["My Newsletter.docx", "Another One.docx"]}
                </p>
            </div>
        `;
    } else {
        message = `
            <div class="newsletter-card">
                <h2 class="newsletter-title">❌ Loading Error</h2>
                <p class="newsletter-excerpt">
                    There was a problem loading your newsletters. Check the browser console 
                    (F12) for detailed error messages. Common issues:
                    <br>• CORS restrictions on .docx files
                    <br>• File upload problems
                    <br>• Incorrect filenames in newsletters.json
                </p>
            </div>
        `;
    }
    
    websiteElements.newsletterArchive.innerHTML = message;
}

// =====================================
// 🎯 SETUP BUTTON CLICKS
// =====================================
function setupAllButtonClicks() {
    console.log('🎯 Setting up button clicks...');
    
    websiteElements.backBtn.addEventListener('click', hideFullNewsletter);
    websiteElements.searchInput.addEventListener('input', handleSearch);
    websiteElements.subscribeBtn.addEventListener('click', handleEmailSignup);
    
    console.log('✅ All buttons working!');
}
