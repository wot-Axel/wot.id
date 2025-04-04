/**
 * Test script for Ceramic integration
 * Run with: npx ts-node src/test-ceramic.ts
 */

const { runSimpleCeramicTest, runCeramicTest } = require('./utils/ceramicTester');

// Run a simple test first
const runTests = async () => {
  console.log('Running simple Ceramic test...');
  const simpleResult = await runSimpleCeramicTest();
  console.log(`Simple test ${simpleResult.success ? 'passed' : 'failed'}: ${simpleResult.message}`);
  console.log('-----------------------------------');
  
  console.log('Running comprehensive Ceramic test...');
  const result = await runCeramicTest();
  console.log(`Comprehensive test ${result.success ? 'passed' : 'failed'}`);
  
  // Print key results
  if (result.success) {
    console.log('Test Results Summary:');
    
    // Check collection creation
    Object.entries(result.results)
      .filter(([key]) => key.includes('_existsAfter'))
      .forEach(([key, value]) => {
        console.log(`- Collection ${key.replace('_existsAfter', '')}: ${value ? 'Created successfully' : 'Failed to create'}`);
      });
    
    // Check validation
    Object.entries(result.results)
      .filter(([key]) => key.includes('_validation'))
      .forEach(([key, value]) => {
        const dataType = key.replace('_validation', '');
        console.log(`- Validation for ${dataType}: ${(value as any).valid ? 'Valid' : 'Invalid'}`);
      });
    
    // Check encryption
    Object.entries(result.results)
      .filter(([key]) => key.includes('_encryption'))
      .forEach(([key, value]) => {
        const dataType = key.replace('_encryption', '');
        const encryptionResult = value as any;
        const encryptionSuccess = JSON.stringify(encryptionResult.original) === JSON.stringify(encryptionResult.decrypted);
        console.log(`- Encryption for ${dataType}: ${encryptionSuccess ? 'Success' : 'Failed'}`);
      });
    
    // Check import/export
    console.log(`- Data export: ${result.results.exportedData ? 'Success' : 'Failed'}`);
    console.log(`- Data import: ${result.results.importResult ? 'Success' : 'Failed'}`);
  } else {
    console.error('Test failed with error:', result.results.error);
  }
};

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
