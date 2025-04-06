# Tableland Migration Documentation

## Overview

This document outlines the migration from Ceramic/ComposeDB to Tableland in the WOT.ID application. The migration was performed to improve reliability, performance, and compatibility with server-side rendering.

## Architecture

### Data Storage

The application now uses Tableland as the primary data storage solution, with fallbacks to ComposeDB and Ceramic for backward compatibility. Tableland provides a decentralized SQL database for Web3 applications, offering better reliability and performance.

### Data Structure

Tableland uses a simple key-value approach with tables having the following columns:
- `id` (PRIMARY KEY)
- `item_key` (TEXT)
- `item_value` (TEXT)
- `created_at` (TEXT)

This differs from ComposeDB's more complex document-based structure, but the application handles the mapping between the two formats.

### Data Access

All components use the `useDataAccess` hook to interact with data, regardless of the underlying storage solution. This hook provides a consistent interface for components to perform CRUD operations.

## Components Updated

The following components have been updated to use the `useDataAccess` hook:

1. **IdentitySection**: Manages user identity data
2. **RealWorldAssetsSection**: Manages real-world asset data
3. **HumanRelationshipsSection**: Manages human relationship data
4. **OrganizationalAffiliationsSection**: Manages organizational affiliation data
5. **DigitalAssetsSection**: Manages digital asset data

## Key Files

1. **/src/utils/tablelandUtils.ts**: Core utilities for Tableland operations
2. **/src/context/TablelandContext.tsx**: React context provider for Tableland
3. **/src/context/DataProviders.tsx**: Manages multiple data contexts during transition
4. **/src/hooks/useDataAccess.ts**: Centralized hook for data access

## Migration Process

The migration process involved:

1. Creating Tableland utilities and context
2. Updating the `useDataAccess` hook to support Tableland
3. Updating components to use the `useDataAccess` hook
4. Testing and validating the migration

## Data Mapping

The application maps between Ceramic `DataType` and Tableland `TableType` as follows:

| Ceramic DataType | Tableland TableType |
|------------------|---------------------|
| PROFILE          | PRIVATE             |
| DOCUMENTS        | PRIVATE             |
| DIGITAL_ASSETS   | DIGITAL_ASSETS      |
| REAL_WORLD_ASSETS| PRIVATE             |
| MEDICAL          | MEDICAL             |
| CONNECTIONS      | CONTACTS            |
| ORGANIZATIONS    | AFFILIATIONS        |
| MESSAGES         | CHAT                |
| PRIVATE          | PRIVATE             |

## Future Development

When developing new components or updating existing ones:

1. Always use the `useDataAccess` hook for data operations
2. Do not directly use Ceramic or ComposeDB APIs
3. Follow the established patterns for error handling and loading states
4. Consider the key-value structure of Tableland when designing data models

## Troubleshooting

If you encounter issues with data access:

1. Check that the component is using the `useDataAccess` hook
2. Verify that the correct `DataType` is being used
3. Inspect the console for error messages
4. Check the Tableland connection status

## References

- [Tableland Documentation](https://docs.tableland.xyz/)
- [Ceramic Documentation](https://developers.ceramic.network/)
- [ComposeDB Documentation](https://composedb.js.org/)
