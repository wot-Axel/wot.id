/**
 * Remove viewport configurations from page files
 * 
 * This script removes viewport configurations from all page files
 * to avoid conflicts with the root layout.tsx viewport configuration
 */

import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';

async function main() {
  try {
    // Find all page.tsx files in the app directory
    const pageFiles = glob.sync('src/app/**/page.tsx');
    
    console.log(`Found ${pageFiles.length} page files to update`);
    
    // Process each file
    for (const filePath of pageFiles) {
      await removeViewportFromFile(filePath);
    }
    
    console.log('Viewport removals completed!');
  } catch (error) {
    console.error('Error removing viewports:', error);
    process.exit(1);
  }
}

async function removeViewportFromFile(filePath) {
  try {
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if the file has a viewport export
    if (content.includes('export const viewport =')) {
      console.log(`Removing viewport from ${filePath}`);
      
      // Remove the viewport export
      const viewportRegex = /export const viewport = \{[^}]*\};/s;
      
      if (viewportRegex.test(content)) {
        // Replace viewport export with nothing
        const updatedContent = content.replace(viewportRegex, '');
        
        // Write updated content back to file
        await fs.writeFile(filePath, updatedContent, 'utf8');
        console.log(`Removed viewport from ${filePath}`);
      } else {
        console.log(`No viewport pattern matched in ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error removing viewport from ${filePath}:`, error);
  }
}

// Execute the main function
main();
