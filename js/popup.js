document.addEventListener('DOMContentLoaded', function() {
    const apiKeyForm = document.getElementById('apiKeyForm');
    const settingsForm = document.getElementById('settingsForm');
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const resetApiKeyButton = document.getElementById('resetApiKey');
    const updateSettingsButton = document.getElementById('updateSettings');
    const enableDesignToggle = document.getElementById('enableDesign');
    const enableDescriptionsToggle = document.getElementById('enableDescriptions');
    const enableTagsToggle = document.getElementById('enableTags');

    // Check if API key exists
    chrome.storage.sync.get(['openaiApiKey', 'settings'], function(data) {
        if (data.openaiApiKey) {
            // API key exists, show settings
            apiKeyForm.classList.add('hidden');
            settingsForm.classList.remove('hidden');
            
            // Load settings
            if (data.settings) {
                enableDesignToggle.checked = data.settings.enableDesign;
                enableDescriptionsToggle.checked = data.settings.enableDescriptions;
                enableTagsToggle.checked = data.settings.enableTags;
            }
        }
    });

    // Save API key
    saveApiKeyButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            apiKeyStatus.textContent = 'Please enter a valid API key';
            return;
        }

        // Validate API key format (basic check)
        if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
            apiKeyStatus.textContent = 'Invalid API key format';
            return;
        }

        // Save API key
        chrome.storage.sync.set({
            'openaiApiKey': apiKey,
            'settings': {
                'enableDesign': true,
                'enableDescriptions': true,
                'enableTags': true
            }
        }, function() {
            apiKeyStatus.textContent = 'API key saved successfully!';
            
            // Show settings after saving API key
            setTimeout(() => {
                apiKeyForm.classList.add('hidden');
                settingsForm.classList.remove('hidden');
            }, 1000);
            
            // Notify content script that API key is set
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0].url.includes('news.ycombinator.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: 'apiKeySet'});
                }
            });
        });
    });

    // Reset API key
    resetApiKeyButton.addEventListener('click', function() {
        chrome.storage.sync.remove(['openaiApiKey'], function() {
            apiKeyForm.classList.remove('hidden');
            settingsForm.classList.add('hidden');
            apiKeyInput.value = '';
            apiKeyStatus.textContent = 'API key has been reset';
        });
    });

    // Update settings
    updateSettingsButton.addEventListener('click', function() {
        const settings = {
            enableDesign: enableDesignToggle.checked,
            enableDescriptions: enableDescriptionsToggle.checked,
            enableTags: enableTagsToggle.checked
        };

        chrome.storage.sync.set({'settings': settings}, function() {
            // Notify content script of settings update
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0].url.includes('news.ycombinator.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'settingsUpdated',
                        settings: settings
                    });
                }
            });
        });
    });
});
