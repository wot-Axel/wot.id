# Tableland Reversion Guide

## Overview

This document outlines the process of reverting from Ceramic Network back to Tableland for data storage in the wot.id application. After experiencing persistent issues with Ceramic integration, we've decided to return to Tableland which previously provided a functioning database solution.

## Why Revert to Tableland?

Despite the theoretical benefits of Ceramic (better identity integration, improved developer experience, cost efficiency), we encountered several practical challenges:

1. **Server-side rendering compatibility issues** - Ceramic's reliance on browser-specific APIs like `localStorage` and `window` caused persistent errors during server-side rendering with Next.js.

2. **Connection reliability problems** - Difficulties maintaining stable connections to Ceramic nodes in production environments.

3. **Complex configuration requirements** - The Ceramic setup required multiple configuration steps and fallback mechanisms that added complexity.

4. **Difficulty running local nodes** - Setting up and maintaining local Ceramic nodes for development proved challenging.

## Implementation Strategy

The reversion to Tableland follows these steps:

1. **Restore Tableland Utilities** - We've restored the original `tablelandUtils.ts` file with all the necessary functions for interacting with Tableland.

2. **Create TablelandContext** - A new React context provider (`TablelandContext.tsx`) replaces the ComposeDB/Ceramic context, providing a similar API for components.

3. **Data Migration** - A migration utility (`migrationUtils.ts`) and UI component (`DatabaseMigrationTool.tsx`) help transfer data from Ceramic to Tableland.

4. **Component Updates** - Components are being updated to use the Tableland context instead of ComposeDB.

## Key Components

### Tableland Utilities (`src/utils/tablelandUtils.ts`)

This file contains the core functions for interacting with Tableland:

- **Database Initialization**: Functions for initializing the Tableland client
- **Table Management**: Functions for creating, checking, and clearing tables
- **Data Operations**: Functions for inserting, retrieving, and deleting data
- **Error Handling**: Retry mechanisms for failed operations

### Tableland Context (`src/context/TablelandContext.tsx`)

This context provides Tableland functionality to components:

- **Client Management**: Initializing and managing the Tableland client
- **Authentication**: Handling user authentication with Tableland
- **State Management**: Managing Tableland-related state
- **Data Operations**: Methods for creating, reading, updating, and deleting data

### Migration Utilities (`src/utils/migrationUtils.ts`)

This file provides utilities for migrating data from Ceramic to Tableland:

- **Data Type Mapping**: Functions to map Ceramic data types to Tableland table types
- **Data Conversion**: Functions to convert Ceramic data format to Tableland format
- **Migration Hooks**: React hooks for performing the migration process

### Migration Tool (`src/components/DatabaseMigrationTool.tsx`)

A UI component that allows users to migrate their data from Ceramic to Tableland:

- **Migration Status**: Shows the current status of the migration process
- **Data Type Selection**: Allows migrating specific data types or all data
- **Results Display**: Shows the results of the migration process

## Usage Guidelines

When working with Tableland in this application:

1. Use the `useTableland` hook to access Tableland functionality in components
2. Follow the same data model patterns established with Ceramic
3. Use the migration tool to transfer existing data from Ceramic to Tableland
4. Report any issues or inconsistencies during the transition

## Benefits of Reverting to Tableland

1. **Improved stability** - Tableland has proven more reliable in our production environment
2. **Better SSR compatibility** - Fewer issues with server-side rendering in Next.js
3. **Simplified architecture** - Less complex configuration and connection management
4. **Familiar implementation** - The team has more experience with Tableland

## Future Considerations

While reverting to Tableland addresses our immediate concerns, we should continue to monitor:

1. **Performance at scale** - Evaluate Tableland's performance as data volume grows
2. **Cost implications** - Track transaction costs on the Optimism network
3. **Identity integration** - Consider alternative approaches for decentralized identity that work well with Tableland

This reversion is a pragmatic decision to ensure application stability and reliability while we continue to evaluate long-term database solutions for decentralized identity management.
