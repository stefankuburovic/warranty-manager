import React from 'react';
import { render } from '@testing-library/react-native';
import ThemeSettingsScreen from '../ThemeSettingsScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('ThemeSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText } = render(
      <ThemeSettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    // 'settings.theme.title' appears in Appbar title
    expect(getAllByText('settings.theme.title').length).toBeGreaterThan(0);
  });
});

