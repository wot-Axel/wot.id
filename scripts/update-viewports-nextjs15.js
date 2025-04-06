/**
 * Update viewport configurations for Next.js 15
 * 
 * This script updates all viewport configurations in Next.js app pages
 * to use the correct object format required by Next.js 15
 */

import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';
const { globSync } = glob;

async function main() {
  try {
    // Find all page.tsx files in the app directory
    const pageFiles = globSync('src/app/**/page.tsx');
    
    // Also include layout.tsx
    const layoutFiles = globSync('src/app/**/layout.tsx');
    
    // Combine all files
    const allFiles = [...pageFiles, ...layoutFiles];
    
    console.log(`Found ${allFiles.length} files to update`);
    
    // Process each file
    for (const filePath of allFiles) {
      await updateViewportInFile(filePath);
    }
    
    console.log('Viewport updates completed!');
  } catch (error) {
    console.error('Error updating viewports:', error);
    process.exit(1);
  }
}

async function updateViewportInFile(filePath) {
  try {
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if the file has a viewport export
    if (content.includes('export const viewport =')) {
      console.log(`Updating viewport in ${filePath}`);
      
      // Replace string viewport with object viewport
      const stringViewportRegex = /export const viewport =\s*["']([^"']*)["'];/;
      const objectViewportRegex = /export const viewport = \{[^}]*\};/s;
      
      let updatedContent;
      
      if (stringViewportRegex.test(content)) {
        // Replace string viewport with object viewport
        updatedContent = content.replace(
          stringViewportRegex,
          (match, viewportString) => {
            // Parse the viewport string
            const width = viewportString.match(/width=([^,]*)/)?.[1] || 'device-width';
            const initialScale = viewportString.match(/initial-scale=([^,]*)/)?.[1] || '1';
            const maximumScale = viewportString.match(/maximum-scale=([^,]*)/)?.[1] || '1';
            
            return `export const viewport = {\n  width: '${width}',\n  initialScale: ${initialScale},\n  maximumScale: ${maximumScale}\n};`;
          }
        );
      } else if (objectViewportRegex.test(content)) {
        // Ensure the object viewport has the correct properties
        updatedContent = content.replace(
          objectViewportRegex,
          (match) => {
            // Check if the viewport object has the required properties
            const hasWidth = match.includes('width:');
            const hasInitialScale = match.includes('initialScale:');
            const hasMaximumScale = match.includes('maximumScale:');
            
            if (hasWidth && hasInitialScale && hasMaximumScale) {
              return match; // Already has the correct properties
            }
            
            // Add missing properties
            return `export const viewport = {\n  width: 'device-width',\n  initialScale: 1,\n  maximumScale: 1,\n  viewportFit: 'cover'\n};`;
          }
        );
      } else {
        console.log(`No viewport pattern matched in ${filePath}`);
        return;
      }
      
      // Write updated content back to file
      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.log(`Updated viewport in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating viewport in ${filePath}:`, error);
  }
}

// Execute the main function
main();
