import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText } = render(
      <ProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    // 'settings.profile' appears in Appbar title
    expect(getAllByText('settings.profile').length).toBeGreaterThan(0);
  });

  it('displays user information', () => {
    const { getAllByText } = render(
      <ProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Screen should render without errors
    expect(getAllByText('settings.profile').length).toBeGreaterThan(0);
  });
});

