import React from 'react';
import { render } from '@testing-library/react-native';
import NotificationHistoryScreen from '../NotificationHistoryScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('NotificationHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText } = render(
      <NotificationHistoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    // 'notification.notificationHistory' appears in Appbar title
    expect(getAllByText('notification.notificationHistory').length).toBeGreaterThan(0);
  });
});

