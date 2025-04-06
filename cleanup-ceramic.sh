#!/bin/bash

# Script to remove all Ceramic and ComposeDB files from the project

# Remove composedb directory
rm -rf /Users/axelnoack/CascadeProjects/wot.id/src/composedb

# Remove context files
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/context/CeramicContext.tsx
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/context/ComposeDBContext.tsx
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/context/DataProviders.tsx

# Remove utility files
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/utils/ceramicConnector.ts
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/utils/ceramicTestHelper.ts
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/utils/ceramicTester.ts
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/utils/ceramicUtils.ts
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/utils/ceramicUtils.js
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/utils/migrationUtils.ts

# Remove type definitions
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/types/ceramic.d.ts

# Remove hooks
rm -f /Users/axelnoack/CascadeProjects/wot.id/src/hooks/useCeramicStatus.ts

# Remove test files
rm -f /Users/axelnoack/CascadeProjects/wot.id/test-ceramic.js
rm -f /Users/axelnoack/CascadeProjects/wot.id/test-composedb-mock.js

# Remove scripts
rm -f /Users/axelnoack/CascadeProjects/wot.id/scripts/setup-local-ceramic.js
rm -f /Users/axelnoack/CascadeProjects/wot.id/scripts/test-ceramic-mock.js

echo "Ceramic and ComposeDB files have been removed."
