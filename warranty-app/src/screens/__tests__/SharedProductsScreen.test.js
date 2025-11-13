import React from 'react';
import { render } from '@testing-library/react-native';
import SharedProductsScreen from '../SharedProductsScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('SharedProductsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { root } = render(
      <SharedProductsScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Screen should render without errors
    expect(root).toBeTruthy();
  });
});

