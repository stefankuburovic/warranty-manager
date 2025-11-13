import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SearchScreen from '../SearchScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <SearchScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('searchbar-search.placeholder')).toBeTruthy();
  });

  it('allows user to enter search query', () => {
    const { getByTestId } = render(
      <SearchScreen navigation={mockNavigation} route={mockRoute} />
    );

    const searchInput = getByTestId('searchbar-search.placeholder');
    fireEvent.changeText(searchInput, 'test query');
    expect(searchInput.props.value).toBe('test query');
  });
});

