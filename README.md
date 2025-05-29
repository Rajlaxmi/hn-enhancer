# Hacker News Enhancer - Chrome Extension

This Chrome extension transforms Hacker News into a minimalistic design website with AI-generated descriptions and tags for each news item.

## Features

- Clean, minimalistic redesign of Hacker News
- AI-generated descriptions for each news item
- Relevant tags for each article
- Customizable settings to enable/disable features
- Responsive design that works on all screen sizes

## Installation Instructions

1. **Download and Extract**
   - Download and extract the extension files to a folder on your computer

2. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" using the toggle in the top-right corner
   - Click "Load unpacked" and select the folder containing the extension files

3. **Set Up Your OpenAI API Key**
   - Click on the extension icon in your browser toolbar
   - Enter your OpenAI API key when prompted
   - Click "Save API Key"

4. **Visit Hacker News**
   - Go to https://news.ycombinator.com/
   - The extension will automatically transform the page

## Usage

- **Toggle Features**: Click the extension icon and use the toggles to enable/disable:
  - Minimalistic design
  - AI-generated descriptions
  - AI-generated tags

- **Reset API Key**: Click "Reset API Key" in the extension popup if you need to change your API key

## Technical Details

- Uses OpenAI's API to generate descriptions and tags
- API key is stored securely in Chrome's sync storage
- Content is generated on-demand when viewing Hacker News

## Privacy Note

This extension sends article titles and URLs to OpenAI's API to generate descriptions and tags. No personal data is collected or stored beyond your API key, which is saved in your browser's secure storage.
