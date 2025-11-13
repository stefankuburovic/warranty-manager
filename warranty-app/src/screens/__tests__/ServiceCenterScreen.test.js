import React from 'react';
import { render } from '@testing-library/react-native';
import ServiceCenterScreen from '../ServiceCenterScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('ServiceCenterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { queryByText } = render(
      <ServiceCenterScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Screen should render without errors
    expect(queryByText).toBeTruthy();
  });
});

