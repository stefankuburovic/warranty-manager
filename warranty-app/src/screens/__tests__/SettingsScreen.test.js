import React from 'react';
import { render } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    // 'settings.title' appears in Appbar title
    expect(getAllByText('settings.title').length).toBeGreaterThan(0);
  });

  it('displays language settings', () => {
    const { queryAllByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    // List.Subheader renders the language text
    expect(queryAllByTestId('list-subheader').length).toBeGreaterThan(0);
  });

  it('displays theme settings', () => {
    const { queryAllByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    // List sections should be present
    expect(queryAllByTestId('list-section').length).toBeGreaterThan(0);
  });
});

