/**
 * Ceramic and ComposeDB Integration Test Runner
 * This script runs both Ceramic and ComposeDB integration tests
 */

import { runCeramicTest } from './src/utils/ceramicTester';
import { initComposeDB } from './src/composedb/client';
import { DataType } from './src/utils/ceramicUtils';

/**
 * Test ComposeDB integration
 */
async function testComposeDB() {
  console.log('🧪 Starting ComposeDB Integration Tests...');
  
  try {
    // Initialize ComposeDB client
    const client = await initComposeDB();
    console.log('✅ ComposeDB client initialized');
    
    // Test creating a record
    const testProfile = {
      name: 'Test User',
      email: 'test@example.com',
      bio: 'This is a test profile'
    };
    
    // Create a test record
    const testRecord = await client.create(DataType.PROFILE, testProfile);
    console.log('✅ Test record created:', testRecord);
    
    // Query for records
    const queryResult = await client.query({
      query: `query { ProfileIndex { edges { node { id } } } }`
    });
    console.log('✅ Query executed:', queryResult);
    
    return {
      success: true,
      results: {
        initialization: { success: true },
        recordCreation: { success: !!testRecord, details: testRecord },
        querying: { success: !!queryResult, details: queryResult }
      }
    };
  } catch (error) {
    console.error('❌ ComposeDB test failed:', error);
    return {
      success: false,
      results: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function runTests() {
  console.log('🧪 Starting Integration Tests...');
  
  try {
    // Run Ceramic tests
    console.log('\n📋 Running Ceramic Tests...');
    const ceramicResults = await runCeramicTest();
    
    // Run ComposeDB tests
    console.log('\n📋 Running ComposeDB Tests...');
    const composeDBResults = await testComposeDB();
    
    console.log('\n📊 Test Results:');
    console.log('-------------------');
    
    // Display Ceramic test results
    console.log('\n🔶 CERAMIC TESTS:');
    Object.entries(ceramicResults.results).forEach(([category, categoryResults]) => {
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
    
    // Display ComposeDB test results
    console.log('\n🔷 COMPOSEDB TESTS:');
    Object.entries(composeDBResults.results).forEach(([category, categoryResults]) => {
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
    const overallSuccess = ceramicResults.success && composeDBResults.success;
    console.log(`🏁 Overall Result: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!overallSuccess) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

runTests();
