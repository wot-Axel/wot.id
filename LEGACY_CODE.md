# Legacy Code Management

## Ceramic and ComposeDB Legacy Code

The application has been migrated from Ceramic/ComposeDB to Tableland for data storage. However, some legacy code remains in the codebase for backward compatibility and reference purposes.

### Why Legacy Code Remains

1. **Backward Compatibility**: The application supports fallback to Ceramic/ComposeDB if Tableland is not available or if there are issues with the Tableland implementation.

2. **Data Migration**: The legacy code is needed for migrating existing data from Ceramic/ComposeDB to Tableland.

3. **Reference Implementation**: The Ceramic/ComposeDB implementation serves as a reference for understanding the data model and structure.

### Legacy Code Locations

The following directories and files contain legacy Ceramic/ComposeDB code:

- `/src/composedb/`: Contains ComposeDB-specific code and utilities
- `/src/context/CeramicContext.tsx`: Context provider for Ceramic
- `/src/context/ComposeDBContext.tsx`: Context provider for ComposeDB
- `/src/utils/ceramicUtils.ts`: Utility functions for Ceramic
- `/src/utils/ceramicConnector.ts`: Connection utilities for Ceramic

### Current Usage

All components should now use the `useDataAccess` hook from `/src/hooks/useDataAccess.ts` for data operations. This hook abstracts away the underlying implementation details and provides a consistent interface regardless of whether Tableland, ComposeDB, or Ceramic is being used.

The `useDataAccess` hook uses the following priority for data storage:

1. Tableland (if enabled)
2. ComposeDB (if enabled and Tableland is disabled)
3. Ceramic (if both Tableland and ComposeDB are disabled)

### Future Cleanup

In the future, once all users have migrated their data to Tableland and there is no longer a need for backward compatibility, the legacy Ceramic/ComposeDB code can be safely removed.

The following steps should be taken for a complete cleanup:

1. Remove all Ceramic/ComposeDB context providers
2. Remove all Ceramic/ComposeDB utility functions
3. Update the `useDataAccess` hook to only use Tableland
4. Remove all Ceramic/ComposeDB dependencies from package.json

### DataType Enum

The `DataType` enum from `ceramicUtils.ts` is still being used by the `useDataAccess` hook for mapping to Tableland table types. This enum should be preserved until a complete refactoring of the data access layer is performed.

```typescript
export enum DataType {
  PROFILE = 'profile',
  DOCUMENTS = 'documents',
  DIGITAL_ASSETS = 'digital_assets',
  REAL_WORLD_ASSETS = 'real_world_assets',
  MEDICAL = 'medical',
  CONNECTIONS = 'connections',
  ORGANIZATIONS = 'organizations',
  MESSAGES = 'messages',
  PRIVATE = 'private'
}
```

## Performance Monitoring

The application now includes performance monitoring for all data operations, allowing for comparison between Tableland, ComposeDB, and Ceramic implementations. This monitoring can be used to verify that Tableland provides better performance than the previous implementations.

Performance metrics are logged to the console and can be accessed programmatically through the `useDataAccess` hook:

```typescript
const { getPerformanceMetrics, getPerformanceComparison } = useDataAccess(DataType.PROFILE);

// Get metrics for the current data source
const metrics = getPerformanceMetrics();

// Compare performance between data sources
const comparison = getPerformanceComparison();
```
