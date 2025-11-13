import React from 'react';
import { render } from '@testing-library/react-native';
import DocumentsScreen from '../DocumentsScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {
    productId: 1,
    productName: 'Test Product',
  },
};

describe('DocumentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { root } = render(
      <DocumentsScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Screen should render without errors
    expect(root).toBeTruthy();
  });
});

