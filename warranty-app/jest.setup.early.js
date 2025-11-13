// Early setup file - runs before Jest environment is initialized
// Mock Expo's winter runtime before any other imports
if (typeof global.__ExpoImportMetaRegistry === 'undefined') {
  global.__ExpoImportMetaRegistry = new Map();
}

// Provide structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

