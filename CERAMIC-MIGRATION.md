# Migrating from Tableland to Ceramic Network

This document outlines the plan for migrating the wot.id application from Tableland to Ceramic Network for data storage.

## Motivation

We're migrating to Ceramic Network for the following reasons:

1. **Better Identity Integration**: Ceramic is built specifically for decentralized identity applications
2. **Improved Developer Experience**: Fewer SQL syntax errors and blockchain-specific issues
3. **Cost Efficiency**: Lower transaction costs and more predictable scaling
4. **Performance**: Better caching and indexing for improved read performance
5. **Community Support**: Larger ecosystem of identity-focused developers and projects

## Migration Plan

### Phase 1: Setup and Proof of Concept (Current Phase)

- [x] Install Ceramic dependencies
- [x] Create basic Ceramic utilities (`ceramicUtils.ts`)
- [x] Create a proof-of-concept component (`CeramicDigitalAssetsSection.tsx`)
- [x] Create Ceramic context provider for application-wide state management
- [x] Integrate with AppKit authentication
- [x] Create test page for validating the proof-of-concept
- [ ] Test the proof-of-concept with real data
- [ ] Gather feedback and make necessary adjustments

### Phase 2: Core Infrastructure

- [ ] Define ComposeDB models for all data types
- [ ] Complete the implementation of all utility functions in `ceramicUtils.ts`
- [ ] Create a migration script to transfer existing data from Tableland to Ceramic
- [ ] Implement proper error handling and retry mechanisms
- [ ] Add comprehensive logging for debugging

### Phase 3: Component Migration

- [ ] Update each component to use Ceramic instead of Tableland:
  - [ ] DigitalAssetsSection
  - [ ] AccountsPasswordsSection
  - [ ] HumanRelationshipsSection
  - [ ] MedicalDataSection
  - [ ] OrganizationalAffiliationsSection
  - [ ] PrivateDataSection
  - [ ] IdentitySection
  - [ ] RealWorldAssetsSection
- [ ] Ensure consistent return types across all components
- [ ] Update UI to reflect Ceramic-specific features

### Phase 4: Testing and Deployment

- [ ] Comprehensive testing of all migrated components
- [ ] Performance testing and optimization
- [ ] Security review
- [ ] Deployment to staging environment
- [ ] User acceptance testing
- [ ] Production deployment

## Technical Implementation Details

### Data Models

Each data type will be represented by a ComposeDB model with the following structure:

```typescript
// Example model definition for PrivateData
const privateDataModel = {
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      key: { type: 'string' },
      value: { type: 'string' },
      created_at: { type: 'string' }
    },
    required: ['id', 'key', 'value', 'created_at']
  },
  accountRelation: { type: 'list' }
};
```

### Authentication Flow

1. User connects their wallet using AppKit (unchanged)
2. CeramicProvider detects the connected wallet and initializes Ceramic
3. Application creates a DID using the wallet's Ethereum address
4. DID is authenticated using the wallet's signing capability
5. Authenticated DID is used for all Ceramic operations
6. User remains connected to their preferred chain while Ceramic handles data operations

This approach maintains our cross-chain architecture where:
- User's primary wallet connection remains on their preferred network
- Data storage operations happen on Ceramic Network
- No network switching is required from the user

### Data Migration Strategy

1. For each user and data type:
   - Check if Tableland table exists
   - If exists, retrieve all data
   - Create corresponding Ceramic collection
   - Insert data into Ceramic collection
   - Verify data integrity
   - Mark migration as complete

2. Fallback mechanism:
   - If migration fails, continue using Tableland for that specific data type
   - Provide manual migration option in UI

## Benefits for Users

- **Better Performance**: Faster data loading and less waiting for blockchain transactions
- **Lower Costs**: Reduced gas fees for data operations
- **Improved Reliability**: Fewer errors related to SQL syntax or blockchain limitations
- **Enhanced Privacy**: Better control over data access and permissions
- **Future-Proof**: Integration with the growing ecosystem of decentralized identity applications

## Timeline

- **Week 1**: Complete Phase 1 (Setup and Proof of Concept) - ✅ Completed
  - Basic utilities and context provider completed
  - Proof-of-concept component created
  - Testing infrastructure set up
  - Schema definitions created
  - AppKit integration implemented
- **Week 2**: Complete Phase 2 (Core Infrastructure) - 🔄 In Progress
  - Define simplified schema models ✅
  - Update utility functions to use schemas ✅
  - Implement data migration strategy
  - Complete error handling and retry mechanisms
  - Add comprehensive logging
- **Week 3**: Complete Phase 3 (Component Migration)
  - Migrate each component one by one
  - Update UI elements
  - Add Ceramic-specific features
- **Week 4**: Complete Phase 4 (Testing and Deployment)
  - Comprehensive testing
  - Performance optimization
  - Production deployment

## Current Status and Next Steps

### Completed
- Created basic Ceramic utilities in `ceramicUtils.ts`
- Implemented `CeramicContext.tsx` for application-wide state management
- Integrated with AppKit for wallet authentication
- Created schema definitions for data types
- Updated the `CeramicDigitalAssetsSection` component to use the Ceramic context

### In Progress
- Testing the integration with real user data
- Implementing proper error handling and recovery mechanisms

### Next Steps
1. Create a data migration utility to transfer existing Tableland data to Ceramic
2. Update the remaining components to use Ceramic instead of Tableland
3. Implement comprehensive testing for all migrated components
4. Add Ceramic-specific features like data sharing and permissions

## Resources

- [Ceramic Documentation](https://developers.ceramic.network/docs/introduction)
- [ComposeDB Documentation](https://composedb.js.org/)
- [Self.ID SDK](https://developers.ceramic.network/reference/self-id/)
- [DID Authentication](https://developers.ceramic.network/docs/advanced/standards/accounts/did-authentication)
