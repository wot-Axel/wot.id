# Tableland Implementation Guide

## Overview

This document provides information about the Tableland implementation in the wot.id application. We've transitioned from a mock implementation to a live implementation that interacts with the Tableland network on Optimism.

## Multi-Chain Architecture

The application uses a multi-chain architecture with the following components:

- **Primary Identity**: Users maintain their primary identity on their preferred network (typically Ethereum L1)
- **Data Storage**: All data is stored on Tableland tables deployed on Optimism for cost efficiency and faster transactions
- **Cross-Chain Signing**: The application handles cross-chain interactions transparently without requiring users to switch networks

## Key Components

### Tableland Utilities (`src/utils/tablelandUtils.ts`)

This file contains the core functions for interacting with Tableland:

- **Table Management**: Functions for creating, checking, and clearing tables
- **Data Operations**: Functions for inserting and retrieving data
- **Error Handling**: Retry mechanisms for failed transactions
- **Input Validation**: Sanitization utilities to prevent SQL injection

### Optimism Provider (`src/utils/optimismProvider.ts`)

This file contains utilities for interacting with the Optimism network:

- **Provider Creation**: Functions to create dedicated Optimism providers
- **Tableland Initialization**: Functions to initialize Tableland with Optimism write capabilities
- **Cross-Chain Signing**: Utilities to enable signing transactions for Optimism while connected to another network

## Table Structure

All tables follow a consistent schema:

```sql
CREATE TABLE <table_type>_<address_prefix> (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL
)
```

The only exception is the Digital Assets table, which has no key field:

```sql
CREATE TABLE digital_assets_<address_prefix> (
  id INTEGER PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL
)
```

## Error Handling

The application includes robust error handling:

- **Retry Mechanism**: Failed transactions are automatically retried up to 3 times with exponential backoff
- **Input Validation**: All inputs are validated and sanitized before being sent to Tableland
- **Graceful Degradation**: Read operations return empty arrays instead of throwing errors to prevent UI crashes

## User Experience

The user experience has been improved in several ways:

- **No Network Switching**: Users can stay on their preferred network while the application handles cross-chain interactions
- **Informative Messages**: Each section includes information about the multi-chain architecture
- **Consistent UI**: The UI has been updated to use a consistent `section-content` class across all components

## Development Guidelines

When working with Tableland in this application:

1. Always use the `initTablelandWithOptimismWrite` function for write operations
2. Use the `executeWithRetry` utility for all blockchain transactions
3. Sanitize all user inputs with the `sanitizeInput` utility
4. Handle errors gracefully to prevent UI crashes
5. Use the consistent table check return format: `{exists: boolean, tableName: string}`

## Future Improvements

Potential areas for future improvement:

1. Add more comprehensive logging for blockchain transactions
2. Implement a transaction queue to manage concurrent operations
3. Add a global loading state for blockchain operations
4. Enhance the retry mechanism with more sophisticated backoff strategies
5. Add more detailed error messages for different types of failures
