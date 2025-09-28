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

    // Event delegation for read-more buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('read-more-btn') || e.target.closest('.read-more-btn')) {
            e.preventDefault();
            const btn = e.target.classList.contains('read-more-btn') ? e.target : e.target.closest('.read-more-btn');
            const newsletterId = btn.getAttribute('data-newsletter-id');
            console.log('Button clicked, newsletter ID:', newsletterId);
            if (newsletterId) {
                showNewsletterDetail(newsletterId);
            }
        }
    });
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
                    console.log(`Successfully loaded newsletter: ${newsletter.title} (ID: ${newsletter.id})`);
                } else {
                    console.warn(`Newsletter object was null for ${filename}`);
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

        // Fallback: create test newsletters to check if UI works
        console.log('Creating fallback test newsletters...');
        newsletters = [
            {
                id: 'test-newsletter-1',
                title: 'Test Newsletter: Formatting Demo',
                content: `
                    <h1 class="document-title">Formatting Test Newsletter</h1>
                    <p class="center"><em>A demonstration of various formatting styles</em></p>

                    <h2>Introduction</h2>
                    <p>This is a test newsletter to verify that <strong>formatting</strong> and <em>styling</em> work correctly.</p>

                    <p class="center">This text should be centered.</p>
                    <p class="right">This text should be right-aligned.</p>

                    <h3>Features Being Tested</h3>
                    <ul>
                        <li>Bold and italic text</li>
                        <li>Centered and right-aligned paragraphs</li>
                        <li>Headings with proper hierarchy</li>
                        <li>Lists and formatting</li>
                    </ul>

                    <blockquote>
                        This is a sample quote to test blockquote styling.
                    </blockquote>

                    <p>Images would appear here if loaded from actual Word documents.</p>
                `,
                textContent: 'Formatting Test Newsletter This is a test newsletter to verify formatting and styling work correctly.',
                excerpt: 'A demonstration of various formatting styles including centered text, bold text, and proper headings.',
                date: new Date().toLocaleDateString(),
                filename: 'test-formatting.docx'
            },
            {
                id: 'test-newsletter-2',
                title: 'Sample Newsletter Content',
                content: `
                    <h1>Sample Newsletter</h1>
                    <p class="center">*Important Announcement*</p>

                    <p>This is another test newsletter with various formatting elements to ensure the system works properly.</p>

                    <h2>Key Points</h2>
                    <p>Here are some <strong>important points</strong> to consider:</p>

                    <ol>
                        <li>Newsletter formatting is preserved</li>
                        <li>Images display correctly</li>
                        <li>Text alignment works as expected</li>
                    </ol>

                    <p class="center">— End of Sample —</p>
                `,
                textContent: 'Sample Newsletter Important Announcement This is another test newsletter with various formatting elements.',
                excerpt: 'Another test newsletter with various formatting elements to ensure the system works properly.',
                date: new Date().toLocaleDateString(),
                filename: 'test-sample.docx'
            }
        ];
        console.log('Fallback newsletters created:', newsletters.length);
        displayNewsletters();
    }
}

/**
 * Load and parse a single .docx file
 */
async function loadDocxFile(filename) {
    try {
        console.log(`Loading ${filename}...`);
        
        const response = await fetch(`Newsletters/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        // Use mammoth.js to convert to HTML (preserves images and formatting)
        const options = {
            convertImage: mammoth.images.imgElement(function(image) {
                return image.read("base64").then(function(imageBuffer) {
                    return {
                        src: "data:" + image.contentType + ";base64," + imageBuffer
                    };
                });
            }),
            styleMap: [
                "p[style-name='Title'] => h1.document-title",
                "p[style-name='Heading 1'] => h1",
                "p[style-name='Heading 2'] => h2",
                "p[style-name='Heading 3'] => h3",
                "p[style-name='Normal'] => p",
                // Handle various center alignment styles
                "p[style-name='center'] => p.center",
                "p[style-name='Centre'] => p.center",
                "p[style-name='Centered'] => p.center",
                "p[style-name='Center'] => p.center",
                // Handle Word's built-in alignment styles
                "p[align='center'] => p.center",
                "p[align='right'] => p.right",
                "p[align='left'] => p.left",
                "p[align='justify'] => p.justify",
                // Handle other common Word styles
                "p[style-name='Quote'] => blockquote",
                "p[style-name='Intense Quote'] => blockquote.intense",
                // Preserve specific paragraph styles with spacing
                "p[style-name='Body Text'] => p.body-text",
                "p[style-name='Normal (Web)'] => p.normal-web",
                // Handle spacing-specific styles
                "p[style-name='No Spacing'] => p.no-spacing",
                "p[style-name='Tight'] => p.tight-spacing",
                "p[style-name='Compact'] => p.compact"
            ],
            includeDefaultStyleMap: true,
            // Include more document information
            includeEmbeddedStyleMap: true
        };

        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options);
        let content = result.value;
        const rawText = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const textContent = rawText.value;

        // Post-process HTML to improve formatting
        content = postProcessHtml(content);

        // Log any conversion messages for debugging
        if (result.messages && result.messages.length > 0) {
            console.log(`Conversion messages for ${filename}:`, result.messages);
        }
        
        if (!content || content.trim().length === 0) {
            throw new Error('Empty document');
        }
        
        // Create newsletter object
        const newsletter = {
            id: filename.replace(/\.[^/.]+$/, ""), // Remove extension
            title: extractTitle(textContent, filename),
            content: content, // HTML content with images
            textContent: textContent, // Plain text for search
            excerpt: extractExcerpt(textContent),
            date: extractDate(textContent, filename),
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
 * Analyze document structure and improve spacing automatically
 */
function analyzeAndImproveSpacing(html) {
    if (!html) return html;

    // Analyze paragraph patterns to determine appropriate spacing
    const paragraphs = html.split(/<\/p>/);
    let improvedHtml = html;

    // Look for patterns that indicate tight spacing should be used
    const tightSpacingPatterns = [
        // Short lines that appear to be related (like addresses, signatures, etc.)
        /<p[^>]*>[^<]{1,50}<\/p>\s*<p[^>]*>[^<]{1,50}<\/p>/g,
        // Lines that appear to be part of a list or structure
        /<p[^>]*>[^<]*[:\-•·]\s*[^<]*<\/p>/g,
        // Date/signature patterns
        /<p[^>]*>[^<]*(date|signed|regards|sincerely|best)[^<]*<\/p>/gi
    ];

    // Apply tight spacing to related content
    tightSpacingPatterns.forEach(pattern => {
        improvedHtml = improvedHtml.replace(pattern, function(match) {
            // Add tight-spacing class to paragraphs that match these patterns
            return match.replace(/<p([^>]*)>/g, '<p$1 class="tight-spacing">');
        });
    });

    // Look for content that should have no spacing (like multi-part headings)
    const noSpacingPatterns = [
        // Sequential short lines that appear to be a single unit
        /<p[^>]*>[^<]{1,30}<\/p>\s*<p[^>]*>[^<]{1,30}<\/p>\s*<p[^>]*>[^<]{1,30}<\/p>/g
    ];

    noSpacingPatterns.forEach(pattern => {
        improvedHtml = improvedHtml.replace(pattern, function(match) {
            // First paragraph gets normal spacing, subsequent ones get no spacing
            let parts = match.split('</p>');
            if (parts.length > 1) {
                // Keep first paragraph as-is, make subsequent ones no-spacing
                for (let i = 1; i < parts.length - 1; i++) {
                    parts[i] = parts[i].replace(/<p([^>]*)>/g, '<p$1 class="no-spacing">');
                }
                return parts.join('</p>');
            }
            return match;
        });
    });

    return improvedHtml;
}

/**
 * Post-process HTML to improve formatting
 */
function postProcessHtml(html) {
    if (!html) return html;

    // Handle common alignment patterns that might not be caught by style mapping
    html = html.replace(/<p([^>]*)style="[^"]*text-align:\s*center[^"]*"([^>]*)>/gi, '<p$1class="center"$2>');
    html = html.replace(/<p([^>]*)style="[^"]*text-align:\s*right[^"]*"([^>]*)>/gi, '<p$1class="right"$2>');
    html = html.replace(/<p([^>]*)style="[^"]*text-align:\s*left[^"]*"([^>]*)>/gi, '<p$1class="left"$2>');
    html = html.replace(/<p([^>]*)style="[^"]*text-align:\s*justify[^"]*"([^>]*)>/gi, '<p$1class="justify"$2>');

    // Look for text that appears to be centered (more conservative approach)
    html = html.replace(/<p>(\s*[^<\n]{1,60}\s*)<\/p>/g, function(match, text) {
        const trimmed = text.trim();
        // Only center very specific patterns that are clearly meant to be centered
        if (trimmed.length > 0 && trimmed.length < 60 &&
            (
             /^\*[^*]+\*$/.test(trimmed) || // Surrounded by single asterisks: *text*
             /^—[^—]+—$/.test(trimmed) || // Surrounded by em dashes: —text—
             /^-{2,}[^-]+-{2,}$/.test(trimmed) || // Surrounded by multiple dashes: --text--
             /^[A-Z\s]{3,}$/.test(trimmed) && trimmed.length < 30 || // All caps short text
             /^[^\w]*[A-Z][^.!?]*[^\w.!?][^\w]*$/.test(trimmed) && trimmed.length < 40 // Title-like without ending punctuation
            )) {
            return `<p class="center">${text}</p>`;
        }
        return match;
    });

    // Improve image handling
    html = html.replace(/<img([^>]+)>/g, '<img$1 loading="lazy">');

    // Wrap standalone images in centered paragraphs if not already wrapped
    html = html.replace(/^(\s*)<img([^>]+)>(\s*)$/gm, '$1<p class="center"><img$2></p>$3');

    // Intelligent spacing analysis and adjustment
    html = analyzeAndImproveSpacing(html);

    // Clean up excessive whitespace and improve spacing
    html = html.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Multiple line breaks to double
    html = html.replace(/<\/p>\s*<p>/g, '</p>\n<p>'); // Standardize paragraph spacing
    html = html.replace(/<\/h[1-6]>\s*<p>/g, function(match) { return match.replace(/\s+/g, '\n'); }); // Clean heading to paragraph spacing
    html = html.replace(/<\/p>\s*<h[1-6]/g, function(match) { return match.replace(/\s+/g, '\n'); }); // Clean paragraph to heading spacing

    // Remove empty paragraphs
    html = html.replace(/<p[^>]*>\s*<\/p>/g, '');

    // Trim leading and trailing whitespace
    html = html.trim();

    return html;
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
        newsletter.textContent.toLowerCase().includes(currentSearch.toLowerCase())
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
        <button class="read-more-btn" data-newsletter-id="${newsletter.id}">
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
    console.log('showNewsletterDetail called with:', newsletterId);
    console.log('Available newsletters:', newsletters.map(n => n.id));
    const newsletter = newsletters.find(n => n.id === newsletterId);
    if (!newsletter) {
        console.log('Newsletter not found!');
        return;
    }
    console.log('Found newsletter:', newsletter.title);
    
    // Populate detail view - only show the content without extracted title/date
    // Hide the title and date elements since content already has its own title
    if (detailTitle) detailTitle.style.display = 'none';
    if (detailDate) detailDate.parentElement.style.display = 'none';
    if (detailContent) detailContent.innerHTML = newsletter.content; // Use innerHTML to show HTML/images
    
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
