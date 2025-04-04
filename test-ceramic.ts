/**
 * Ceramic Integration Test Runner
 * This script runs the Ceramic integration tests
 */

import { runCeramicTest } from './src/utils/ceramicTester';

async function runTests() {
  console.log('🧪 Starting Ceramic Integration Tests...');
  
  try {
    const { success, results } = await runCeramicTest();
    
    console.log('\n📊 Test Results:');
    console.log('-------------------');
    
    // Display results for each test category
    Object.entries(results).forEach(([category, categoryResults]) => {
      console.log(`\n🔍 ${category}:`);
      
      if (categoryResults && typeof categoryResults === 'object' && !Array.isArray(categoryResults)) {
        Object.entries(categoryResults as Record<string, any>).forEach(([testName, testResult]) => {
          const status = testResult.success ? '✅ PASS' : '❌ FAIL';
          console.log(`  ${status} - ${testName}`);
          
          if (!testResult.success && testResult.error) {
            console.log(`    Error: ${testResult.error}`);
          }
          
          if (testResult.details) {
            console.log(`    Details: ${JSON.stringify(testResult.details, null, 2)}`);
          }
        });
      } else {
        const status = categoryResults ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} - ${category}`);
      }
    });
    
    console.log('\n-------------------');
    console.log(`🏁 Overall Result: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

runTests();
