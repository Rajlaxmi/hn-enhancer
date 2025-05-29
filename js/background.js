// Background script for handling API requests and initialization
let cachedApiKey = null;

// Listen for installation or update
chrome.runtime.onInstalled.addListener(function() {
  // Check if API key exists
  chrome.storage.sync.get(['openaiApiKey'], function(data) {
    if (!data.openaiApiKey) {
      // No API key found, will prompt via popup when user clicks extension icon
      console.log('No API key found, will prompt user');
    } else {
      cachedApiKey = data.openaiApiKey;
    }
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'generateContent') {
    // Get API key from storage if not cached
    if (!cachedApiKey) {
      chrome.storage.sync.get(['openaiApiKey'], function(data) {
        if (data.openaiApiKey) {
          cachedApiKey = data.openaiApiKey;
          generateContentWithOpenAI(request.url, request.title, cachedApiKey, sendResponse);
        } else {
          sendResponse({error: 'API key not found'});
        }
      });
      return true; // Keep the message channel open for async response
    } else {
      generateContentWithOpenAI(request.url, request.title, cachedApiKey, sendResponse);
      return true; // Keep the message channel open for async response
    }
  }
});

// Function to generate content using OpenAI API
async function generateContentWithOpenAI(url, title, apiKey, sendResponse) {
  try {
    // Prepare the prompt for OpenAI
    const prompt = `Generate a concise description (2-3 sentences) and 4-6 relevant tags for this article: "${title}" from ${url}. 
    Format the response as JSON with "description" and "tags" fields. 
    The description should summarize what the article is about based on the title and URL. 
    The tags should be individual keywords or short phrases related to the topic.`;

    // Make API request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates concise descriptions and relevant tags for news articles."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      sendResponse({error: data.error.message || 'Error calling OpenAI API'});
      return;
    }

    // Parse the response content as JSON
    try {
      const content = data.choices[0].message.content;
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      if (jsonContent && jsonContent.description && jsonContent.tags) {
        sendResponse({
          description: jsonContent.description,
          tags: jsonContent.tags
        });
      } else {
        // Fallback parsing if JSON is not properly formatted
        const descriptionMatch = content.match(/description["\s:]+([^"]+)/i);
        const tagsMatch = content.match(/tags["\s:]+\[([^\]]+)\]/i);
        
        const description = descriptionMatch ? descriptionMatch[1].trim() : 'Description not available';
        const tagsString = tagsMatch ? tagsMatch[1] : '';
        const tags = tagsString.split(',').map(tag => tag.trim().replace(/"/g, ''));
        
        sendResponse({
          description: description,
          tags: tags.length > 0 ? tags : ['general']
        });
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      sendResponse({error: 'Failed to parse AI response'});
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    sendResponse({error: 'Network error or API failure'});
  }
}
