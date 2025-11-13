import React from 'react';
import { render } from '@testing-library/react-native';
import StatisticsScreen from '../StatisticsScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('StatisticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <StatisticsScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('statistics.title')).toBeTruthy();
  });
});

