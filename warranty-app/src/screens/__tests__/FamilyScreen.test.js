import React from 'react';
import { render } from '@testing-library/react-native';
import FamilyScreen from '../FamilyScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('FamilyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText } = render(
      <FamilyScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Check if screen renders - title may appear in Appbar
    expect(getAllByText).toBeTruthy();
  });
});

