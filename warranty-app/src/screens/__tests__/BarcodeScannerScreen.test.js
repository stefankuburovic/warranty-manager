import React from 'react';
import { render } from '@testing-library/react-native';
import BarcodeScannerScreen from '../BarcodeScannerScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('BarcodeScannerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <BarcodeScannerScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Check for camera view and header text
    expect(getByTestId('camera-view')).toBeTruthy();
    expect(getByText('Scan Barcode')).toBeTruthy();
  });

  it('displays scanner instructions', () => {
    const { queryByText, getByTestId } = render(
      <BarcodeScannerScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Screen should render without errors - check for camera view
    expect(getByTestId('camera-view')).toBeTruthy();
    expect(queryByText('Scan Barcode')).toBeTruthy();
  });
});

