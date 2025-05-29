// Generate simple icons for the extension
const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Border
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = Math.max(1, size / 16);
  ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, size - ctx.lineWidth, size - ctx.lineWidth);
  
  // "HN" text
  ctx.fillStyle = '#2b2b2b';
  ctx.font = `bold ${size * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HN', size / 2, size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated icon: ${outputPath}`);
}

// Generate icons of different sizes
const sizes = [16, 48, 128];
sizes.forEach(size => {
  generateIcon(size, `./images/icon${size}.png`);
});

console.log('All icons generated successfully!');
