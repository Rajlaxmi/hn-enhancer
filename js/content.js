// Content script for transforming Hacker News into minimalistic design
(function() {
    // Store original page content
    const originalContent = document.body.innerHTML;
    let settings = {
        enableDesign: true,
        enableDescriptions: true,
        enableTags: true
    };
    let currentPage = 1;
    let storyCache = {};

    // Check if API key exists and settings
    function initialize() {
        chrome.storage.sync.get(['openaiApiKey', 'settings'], function(data) {
            if (data.openaiApiKey) {
                if (data.settings) {
                    settings = data.settings;
                }
                if (settings.enableDesign) {
                    transformPage();
                }
            } else {
                // No API key, prompt user to set it
                console.log('No API key found. Extension icon should be clicked to set up.');
            }
        });
    }

    // Listen for messages from popup or background
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'apiKeySet') {
            // API key was just set, transform the page
            transformPage();
        } else if (request.action === 'settingsUpdated') {
            settings = request.settings;
            if (settings.enableDesign) {
                transformPage();
            } else {
                // Restore original page
                document.body.innerHTML = originalContent;
                document.body.classList.remove('hn-enhanced');
            }
        }
    });

    // Transform the page to minimalistic design
    function transformPage() {
        // Add enhanced class to body
        document.body.classList.add('hn-enhanced');
        
        // Extract current page number
        const moreLink = document.querySelector('a.morelink');
        if (moreLink) {
            const hrefMatch = moreLink.href.match(/p=(\d+)/);
            if (hrefMatch && hrefMatch[1]) {
                currentPage = parseInt(hrefMatch[1]) - 1;
            }
        }
        
        // Create pagination
        const pagination = createPagination();
        
        // Create main content container
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        
        // Add title
        const title = document.createElement('h1');
        title.textContent = 'Hacker News Stories';
        title.style.marginTop = '1.5em';
        mainContent.appendChild(title);
        
        // Extract and transform stories
        const stories = extractStories();
        stories.forEach(story => {
            const storyElement = createStoryElement(story);
            mainContent.appendChild(storyElement);
        });
        
        // Clear body and add new content
        document.body.innerHTML = '';
        document.body.appendChild(pagination);
        document.body.appendChild(mainContent);
    }

    // Create pagination element
    function createPagination() {
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // Create page links (current page and 4 more)
        for (let i = 1; i <= 5; i++) {
            const pageLink = document.createElement('a');
            pageLink.href = i === 1 ? 'news' : `news?p=${i}`;
            pageLink.textContent = i;
            if (i === currentPage) {
                pageLink.className = 'active';
            }
            pagination.appendChild(pageLink);
            
            // Add space between links
            if (i < 5) {
                pagination.appendChild(document.createTextNode(' '));
            }
        }
        
        return pagination;
    }

    // Extract stories from the page
    function extractStories() {
        const stories = [];
        const rows = document.querySelectorAll('tr.athing');
        
        rows.forEach(row => {
            // Get the next row for metadata
            const metaRow = row.nextElementSibling;
            if (!metaRow) return;
            
            // Extract story data
            const id = row.id;
            const titleElement = row.querySelector('td.title > span.titleline > a');
            const siteElement = row.querySelector('span.sitestr');
            
            // Extract points and comments
            const scoreElement = metaRow.querySelector('span.score');
            const commentLink = Array.from(metaRow.querySelectorAll('a')).find(a => a.textContent.includes('comment') || a.textContent.includes('discuss'));
            
            if (titleElement) {
                const story = {
                    id: id,
                    title: titleElement.textContent,
                    url: titleElement.href,
                    domain: siteElement ? siteElement.textContent : new URL(titleElement.href).hostname,
                    points: scoreElement ? parseInt(scoreElement.textContent) : 0,
                    comments: commentLink ? (commentLink.textContent === 'discuss' ? 0 : parseInt(commentLink.textContent)) : 0,
                    commentUrl: commentLink ? commentLink.href : `item?id=${id}`
                };
                stories.push(story);
            }
        });
        
        return stories;
    }

    // Create a story element
    function createStoryElement(story) {
        const storyElement = document.createElement('div');
        storyElement.className = 'story';
        storyElement.dataset.id = story.id;
        
        // Create story header (title and meta)
        const storyHeader = document.createElement('div');
        storyHeader.className = 'story-header';
        
        // Create story title section
        const storyTitle = document.createElement('div');
        storyTitle.className = 'story-title';
        
        // Add title
        const titleH2 = document.createElement('h2');
        const titleLink = document.createElement('a');
        titleLink.href = story.url;
        titleLink.textContent = story.title;
        titleLink.target = '_blank';
        titleH2.appendChild(titleLink);
        storyTitle.appendChild(titleH2);
        
        // Add URL line
        const urlLine = document.createElement('div');
        urlLine.className = 'url-line';
        const urlLink = document.createElement('a');
        urlLink.href = story.url;
        urlLink.className = 'url';
        urlLink.textContent = story.domain;
        urlLink.target = '_blank';
        urlLine.appendChild(urlLink);
        storyTitle.appendChild(urlLine);
        
        storyHeader.appendChild(storyTitle);
        
        // Create meta section (points and comments)
        const meta = document.createElement('div');
        meta.className = 'meta';
        
        // Add points
        const pointsButton = document.createElement('button');
        pointsButton.className = 'meta-button';
        pointsButton.title = 'Points';
        pointsButton.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 4l7 14H5z"/>
            </svg>
            ${story.points}
        `;
        meta.appendChild(pointsButton);
        
        // Add comments
        const commentsLink = document.createElement('a');
        commentsLink.href = story.commentUrl;
        commentsLink.className = 'meta-button';
        commentsLink.title = 'Comments';
        commentsLink.target = '_blank';
        commentsLink.innerHTML = `
            <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; margin-right: 4px;">
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            ${story.comments}
        `;
        meta.appendChild(commentsLink);
        
        storyHeader.appendChild(meta);
        storyElement.appendChild(storyHeader);
        
        // Add description placeholder if enabled
        if (settings.enableDescriptions) {
            const description = document.createElement('div');
            description.className = 'description';
            description.innerHTML = '<span class="loading-indicator"></span> Generating description...';
            storyElement.appendChild(description);
        }
        
        // Add tags placeholder if enabled
        if (settings.enableTags) {
            const tags = document.createElement('div');
            tags.className = 'tags';
            tags.innerHTML = '<span class="loading-indicator"></span> Generating tags...';
            storyElement.appendChild(tags);
        }
        
        // Generate content if descriptions or tags are enabled
        if (settings.enableDescriptions || settings.enableTags) {
            generateContent(story, storyElement);
        }
        
        return storyElement;
    }

    // Generate description and tags using OpenAI API
    function generateContent(story, storyElement) {
        // Check cache first
        if (storyCache[story.id]) {
            updateStoryContent(storyElement, storyCache[story.id]);
            return;
        }
        
        // Request content generation from background script
        chrome.runtime.sendMessage({
            action: 'generateContent',
            url: story.url,
            title: story.title
        }, function(response) {
            if (response && !response.error) {
                // Cache the response
                storyCache[story.id] = response;
                updateStoryContent(storyElement, response);
            } else {
                // Handle error
                const errorMsg = response?.error || 'Failed to generate content';
                if (settings.enableDescriptions) {
                    const description = storyElement.querySelector('.description');
                    if (description) {
                        description.textContent = `(Website not parsed) ${story.title}`;
                    }
                }
                if (settings.enableTags) {
                    const tags = storyElement.querySelector('.tags');
                    if (tags) {
                        const domain = story.domain.replace(/^www\./, '');
                        tags.innerHTML = `<span class="tag">${domain}</span>`;
                    }
                }
            }
        });
    }

    // Update story element with generated content
    function updateStoryContent(storyElement, content) {
        if (settings.enableDescriptions) {
            const description = storyElement.querySelector('.description');
            if (description) {
                description.textContent = content.description;
            }
        }
        
        if (settings.enableTags) {
            const tagsContainer = storyElement.querySelector('.tags');
            if (tagsContainer) {
                tagsContainer.innerHTML = '';
                if (Array.isArray(content.tags)) {
                    content.tags.forEach(tag => {
                        const tagSpan = document.createElement('span');
                        tagSpan.className = 'tag';
                        tagSpan.textContent = tag;
                        tagsContainer.appendChild(tagSpan);
                        tagsContainer.appendChild(document.createTextNode(' '));
                    });
                } else if (typeof content.tags === 'string') {
                    // Handle case where tags might be a comma-separated string
                    const tags = content.tags.split(',');
                    tags.forEach(tag => {
                        const tagSpan = document.createElement('span');
                        tagSpan.className = 'tag';
                        tagSpan.textContent = tag.trim();
                        tagsContainer.appendChild(tagSpan);
                        tagsContainer.appendChild(document.createTextNode(' '));
                    });
                }
            }
        }
    }

    // Initialize the extension
    initialize();
})();
