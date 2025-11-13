import React from 'react';
import { render } from '@testing-library/react-native';
import NotificationPreferencesScreen from '../NotificationPreferencesScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('NotificationPreferencesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { root } = render(
      <NotificationPreferencesScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Screen should render without errors
    expect(root).toBeTruthy();
  });
});

