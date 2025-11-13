import React from 'react';
import { render } from '@testing-library/react-native';
import NotificationSettingsScreen from '../NotificationSettingsScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('NotificationSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    // 'notification.notificationSettings' appears in Appbar title
    expect(getAllByText('notification.notificationSettings').length).toBeGreaterThan(0);
  });
});

