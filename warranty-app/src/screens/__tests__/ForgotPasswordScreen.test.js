import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ForgotPasswordScreen from '../ForgotPasswordScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('auth.forgotPassword')).toBeTruthy();
    expect(getByTestId('label-auth.email')).toBeTruthy();
  });

  it('allows user to enter email', () => {
    const { getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    const emailInput = getByTestId('input-auth.email');
    fireEvent.changeText(emailInput, 'test@example.com');
    expect(emailInput.props.value).toBe('test@example.com');
  });
});

