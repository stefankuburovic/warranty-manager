import React from 'react';
import { render } from '@testing-library/react-native';
import FilterScreen from '../FilterScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('FilterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText } = render(
      <FilterScreen navigation={mockNavigation} route={mockRoute} />
    );

    // 'search.filter.title' appears in Appbar title
    expect(getAllByText('search.filter.title').length).toBeGreaterThan(0);
  });
});

