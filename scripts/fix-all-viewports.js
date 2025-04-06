#!/usr/bin/env node

/**
 * Fix Next.js metadata viewport warnings for all pages
 * 
 * This script adds a viewport export to all Next.js app pages
 * to prevent viewport warnings during build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Standard viewport configuration
const viewportConfig = 'width=device-width, initial-scale=1, maximum-scale=1';

// List of directories to check
const pageDirs = [
  'src/app',
  'src/app/about',
  'src/app/about/how',
  'src/app/about/contribute',
  'src/app/about/why',
  'src/app/about/who',
  'src/app/chat',
  'src/app/legal',
  'src/app/read',
  'src/app/trust',
  'src/app/write',
  'src/app/me',
  'src/app/transact',
  'src/app/attestation',
  'src/app/example'
];

// Process a single file
function processFile(filePath) {
  try {
    // Skip if file doesn't exist
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if file already has viewport export
    if (content.includes('export const viewport')) {
      return;
    }
    
    console.log(`Adding viewport to ${filePath}`);
    
    // Add viewport export at the end of the file
    const updatedContent = content + `\n\nexport const viewport = {\n  viewportFit: 'cover',\n  width: 'device-width',\n  initialScale: 1,\n  maximumScale: 1\n};\n`;
    
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Fixed viewport in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Main function
function main() {
  // Process each directory
  for (const dir of pageDirs) {
    const fullDir = path.join(projectRoot, dir);
    
    // Skip if directory doesn't exist
    if (!fs.existsSync(fullDir)) {
      continue;
    }
    
    // Process page.tsx file in this directory
    const pagePath = path.join(fullDir, 'page.tsx');
    processFile(pagePath);
  }
  
  // Also process not-found.tsx in the root app directory
  processFile(path.join(projectRoot, 'src/app/not-found.tsx'));
  
  console.log('Viewport fixes completed!');
}

main();
