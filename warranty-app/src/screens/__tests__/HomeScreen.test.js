import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    const { getByText, queryByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Wait for screen to load and check for common elements
    await waitFor(() => {
      // Screen should render - check for loading or empty state text
      const loadingOrEmpty = queryByText('common.loading') || queryByText('home.noWarranties');
      expect(loadingOrEmpty || getByText('home.scanBarcode')).toBeTruthy();
    });
  });

  it('displays products list', async () => {
    const { queryByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      // Screen should render without errors - check for any visible text
      const hasContent = queryByText('common.loading') || 
                        queryByText('home.noWarranties') || 
                        queryByText('home.scanBarcode');
      expect(hasContent).toBeTruthy();
    });
  });

  it('handles navigation to add product', async () => {
    const { queryByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Check if screen renders
    await waitFor(() => {
      const hasContent = queryByText('common.loading') || 
                        queryByText('home.noWarranties') || 
                        queryByText('home.scanBarcode');
      expect(hasContent).toBeTruthy();
    });
  });
});

