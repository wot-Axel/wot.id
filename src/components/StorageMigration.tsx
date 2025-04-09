'use client';

import React, { useEffect, useState } from 'react';
import { useStorage } from '@/context/StorageContext';
import { TableType } from '@/utils/storageUtils';
import { 
  migrateLocalStorageToGun, 
  isMigrationNeeded, 
  markMigrationComplete,
  hasMigrationRun
} from '@/utils/migrationUtils';

export const StorageMigration: React.FC = () => {
  const storage = useStorage();
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [migrationStats, setMigrationStats] = useState<{
    migrated: number;
    skipped: number;
    errors: number;
  }>({ migrated: 0, skipped: 0, errors: 0 });

  useEffect(() => {
    // Only run migration if storage is ready and migration hasn't run before
    if (storage.isReady && !hasMigrationRun()) {
      checkAndMigrate();
    }
  }, [storage.isReady]);

  const checkAndMigrate = async () => {
    try {
      // Check if migration is needed for private data
      const privateNeedsMigration = await isMigrationNeeded(TableType.PRIVATE);
      
      // Check if migration is needed for contacts data
      const contactsNeedsMigration = await isMigrationNeeded(TableType.CONTACTS);
      
      if (!privateNeedsMigration && !contactsNeedsMigration) {
        console.log('[MIGRATION] No migration needed');
        markMigrationComplete();
        return;
      }
      
      // Start migration
      setMigrationStatus('running');
      
      let totalMigrated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      
      // Migrate private data if needed
      if (privateNeedsMigration) {
        const privateStats = await migrateLocalStorageToGun(TableType.PRIVATE);
        totalMigrated += privateStats.migrated;
        totalSkipped += privateStats.skipped;
        totalErrors += privateStats.errors;
      }
      
      // Migrate contacts data if needed
      if (contactsNeedsMigration) {
        const contactsStats = await migrateLocalStorageToGun(TableType.CONTACTS);
        totalMigrated += contactsStats.migrated;
        totalSkipped += contactsStats.skipped;
        totalErrors += contactsStats.errors;
      }
      
      // Update stats
      setMigrationStats({
        migrated: totalMigrated,
        skipped: totalSkipped,
        errors: totalErrors
      });
      
      // Mark migration as complete
      markMigrationComplete();
      setMigrationStatus('completed');
      
      console.log('[MIGRATION] Migration completed', { 
        migrated: totalMigrated, 
        skipped: totalSkipped, 
        errors: totalErrors 
      });
    } catch (error) {
      console.error('[MIGRATION] Migration failed:', error);
      setMigrationStatus('error');
    }
  };

  // This component doesn't render anything visible
  return null;
};
