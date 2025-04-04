/**
 * ComposeDB Integration
 * This file exports all ComposeDB functionality for easy access
 */

// Export all ComposeDB functionality
export * from './config';
export * from './models';
export * from './client';

// Export migration utilities
import { DataType } from '@/utils/ceramicUtils';
import { getRecords as getLocalRecords } from '@/utils/ceramicUtils';
import { createRecord as createComposeRecord } from './client';

/**
 * Migrate data from localStorage to ComposeDB
 * @param dataType The type of data to migrate
 * @param did The DID of the user
 * @returns Number of records migrated
 */
export const migrateToComposeDB = async (
  dataType: DataType,
  did: string
): Promise<number> => {
  // Get the collection ID
  const collectionId = `${dataType}_${did}`;
  
  // Get all records from localStorage
  const records = await getLocalRecords({ did: { id: did } }, collectionId);
  
  // Create each record in ComposeDB
  let migratedCount = 0;
  
  for (const record of records) {
    try {
      await createComposeRecord(
        dataType,
        collectionId,
        record.content,
        record.tags || []
      );
      migratedCount++;
    } catch (error) {
      console.error(`Error migrating record ${record.id}:`, error);
    }
  }
  
  return migratedCount;
};

/**
 * Migrate all data from localStorage to ComposeDB
 * @param did The DID of the user
 * @returns Object with counts of migrated records by data type
 */
export const migrateAllToComposeDB = async (
  did: string
): Promise<Record<DataType, number>> => {
  const results: Partial<Record<DataType, number>> = {};
  
  // Migrate each data type
  for (const dataType of Object.values(DataType)) {
    results[dataType] = await migrateToComposeDB(dataType, did);
  }
  
  return results as Record<DataType, number>;
};
