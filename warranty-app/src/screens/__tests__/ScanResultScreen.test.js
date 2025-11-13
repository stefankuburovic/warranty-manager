import React from 'react';
import { render } from '@testing-library/react-native';
import ScanResultScreen from '../ScanResultScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {
    barcode: '1234567890',
    productData: {
      name: 'Test Product',
    },
  },
};

describe('ScanResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <ScanResultScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Test Product')).toBeTruthy();
  });
});

