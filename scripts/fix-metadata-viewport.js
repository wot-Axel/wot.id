#!/usr/bin/env node

/**
 * Fix Next.js metadata viewport warnings
 * 
 * This script updates the metadata exports in Next.js app pages
 * to move viewport configuration from metadata to a separate viewport export
 * as required by Next.js 15.2.4+
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// List of directories to check based on the warnings
const directoriesToCheck = [
  path.join(projectRoot, 'src/app'),
  path.join(projectRoot, 'src/app/about'),
  path.join(projectRoot, 'src/app/about/how'),
  path.join(projectRoot, 'src/app/about/contribute'),
  path.join(projectRoot, 'src/app/about/why'),
  path.join(projectRoot, 'src/app/about/who'),
  path.join(projectRoot, 'src/app/chat'),
  path.join(projectRoot, 'src/app/legal'),
  path.join(projectRoot, 'src/app/read'),
  path.join(projectRoot, 'src/app/trust'),
  path.join(projectRoot, 'src/app/write'),
  path.join(projectRoot, 'src/app/me'),
  path.join(projectRoot, 'src/app/transact'),
  path.join(projectRoot, 'src/app/attestation'),
  path.join(projectRoot, 'src/app/example')
];

// Additional files to check based on build warnings
const additionalFiles = [
  path.join(projectRoot, 'src/app/not-found.tsx'),
  path.join(projectRoot, 'src/app/layout.tsx')
];

async function fixViewportInFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Check if the file has a metadata export with viewport
    if (content.includes('export const metadata') && content.includes('viewport:')) {
      console.log(`Fixing viewport in ${filePath}`);
      
      // Extract the viewport configuration - handle both quoted and unquoted formats
      const viewportMatch = content.match(/viewport:\s*({[^}]*}|"[^"]*"|'[^']*')/);
      if (!viewportMatch) return;
      
      const viewportConfig = viewportMatch[0];
      
      // Remove viewport from metadata
      let updatedContent = content.replace(viewportConfig, '');
      
      // Fix any double commas that might have been created
      updatedContent = updatedContent.replace(/,\s*,/g, ',');
      updatedContent = updatedContent.replace(/{\s*,/g, '{');
      updatedContent = updatedContent.replace(/,\s*}/g, '}');
      
      // Add viewport export
      const metadataEndMatch = updatedContent.match(/export const metadata[^;]*;/);
      if (metadataEndMatch) {
        const metadataEnd = metadataEndMatch[0];
        const viewportExport = `\n\nexport const viewport = ${viewportConfig.replace('viewport:', '')};`;
        updatedContent = updatedContent.replace(metadataEnd, metadataEnd + viewportExport);
      }
      
      await writeFile(filePath, updatedContent, 'utf8');
      console.log(`Fixed viewport in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await processDirectory(filePath);
    } else if (file === 'page.tsx' || file === 'page.jsx' || file === 'layout.tsx' || file === 'layout.jsx') {
      await fixViewportInFile(filePath);
    }
  }
}

async function main() {
  for (const directory of directoriesToCheck) {
    await processDirectory(directory);
  }
  console.log('Viewport fixes completed!');
}

main().catch(console.error);
