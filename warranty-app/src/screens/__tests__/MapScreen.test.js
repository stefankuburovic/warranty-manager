import React from 'react';
import { render } from '@testing-library/react-native';
import MapScreen from '../MapScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('MapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { root } = render(
      <MapScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Screen should render without errors
    expect(root).toBeTruthy();
  });
});

