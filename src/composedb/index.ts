/**
 * ComposeDB Integration
 * This file exports all ComposeDB functionality for easy access
 */

// Export all ComposeDB functionality
export * from './config';
export * from './models';
export * from './client';

// Export migration utilities
import { DataType } from './ceramic';
import { getRecords as getLocalRecords } from './ceramic';
import { createRecord as createComposeRecord } from './client';
import { DID } from 'dids';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { initCeramic } from './ceramic';
import { createDIDFromId } from './fix-types';

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
  
  // Initialize a Ceramic client
  const ceramic = await initCeramic();
  
  // Get all records from localStorage
  const records = await getLocalRecords(ceramic, collectionId);
  
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
