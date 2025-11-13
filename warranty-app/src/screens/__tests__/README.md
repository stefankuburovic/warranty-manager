# Screen Tests

This directory contains test files for all screens in the warranty manager application.

## Test Structure

Each test file follows a consistent structure:
- **Setup**: Mock navigation and route objects
- **Rendering Tests**: Verify screens render without errors
- **Component Tests**: Test specific UI elements and interactions
- **User Interaction Tests**: Test user input and button presses

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Files

### Authentication Screens
- `LoginScreen.test.js` - Tests login functionality
- `RegisterScreen.test.js` - Tests user registration
- `ForgotPasswordScreen.test.js` - Tests password recovery

### Product Management Screens
- `HomeScreen.test.js` - Tests product list display
- `AddProductScreen.test.js` - Tests product creation form
- `EditProductScreen.test.js` - Tests product editing
- `ProductDetailScreen.test.js` - Tests product details display

### Scanning Screens
- `BarcodeScannerScreen.test.js` - Tests barcode scanning
- `OCRScannerScreen.test.js` - Tests OCR receipt scanning
- `ScanResultScreen.test.js` - Tests scan results display

### Settings & Profile Screens
- `SettingsScreen.test.js` - Tests app settings
- `ProfileScreen.test.js` - Tests user profile
- `ThemeSettingsScreen.test.js` - Tests theme selection

### Feature Screens
- `SearchScreen.test.js` - Tests product search
- `FilterScreen.test.js` - Tests filtering functionality
- `StatisticsScreen.test.js` - Tests statistics display
- `ExportScreen.test.js` - Tests PDF export
- `DocumentsScreen.test.js` - Tests document management
- `FamilyScreen.test.js` - Tests family sharing
- `SharedProductsScreen.test.js` - Tests shared products display

### Notification Screens
- `NotificationSettingsScreen.test.js` - Tests notification settings
- `NotificationPreferencesScreen.test.js` - Tests notification preferences
- `NotificationHistoryScreen.test.js` - Tests notification history

### Map & Service Screens
- `MapScreen.test.js` - Tests map display
- `ServiceCenterScreen.test.js` - Tests service center locations

## Test Coverage

Each test file includes:
1. **Basic Rendering**: Ensures the screen renders without crashing
2. **Component Presence**: Verifies key UI elements are displayed
3. **User Interactions**: Tests user input and button presses
4. **Navigation**: Tests navigation between screens

## Mocking

The test setup (`jest.setup.js`) includes mocks for:
- React Navigation
- React Native Paper components
- Expo modules (Camera, ImagePicker, etc.)
- API clients
- Context providers (Auth, Theme, Toast)

## Adding New Tests

When adding a new screen:
1. Create a test file: `ScreenName.test.js`
2. Import the screen component
3. Mock navigation and route props
4. Write tests for rendering and interactions
5. Run tests to ensure they pass

## Best Practices

- Keep tests focused on one aspect at a time
- Use descriptive test names
- Mock external dependencies
- Test user interactions, not implementation details
- Maintain test independence (each test should work in isolation)

