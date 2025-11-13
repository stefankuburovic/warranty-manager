import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

// Mock route
const mockRoute = {
  params: {},
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('auth.signIn')).toBeTruthy();
    expect(getByTestId('label-auth.usernameOrEmail')).toBeTruthy();
    expect(getByTestId('label-auth.password')).toBeTruthy();
  });

  it('displays email input field', () => {
    const { getByTestId } = render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const emailLabel = getByTestId('label-auth.usernameOrEmail');
    expect(emailLabel).toBeTruthy();
  });

  it('displays password input field', () => {
    const { getByTestId } = render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const passwordLabel = getByTestId('label-auth.password');
    expect(passwordLabel).toBeTruthy();
  });

  it('shows login button', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const loginButton = getByText('auth.signIn');
    expect(loginButton).toBeTruthy();
  });

  it('allows user to enter email', () => {
    const { getByTestId } = render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const emailInput = getByTestId('input-auth.usernameOrEmail');
    fireEvent.changeText(emailInput, 'test@example.com');
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('allows user to enter password', () => {
    const { getByTestId } = render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const passwordInput = getByTestId('input-auth.password');
    fireEvent.changeText(passwordInput, 'password123');
    expect(passwordInput.props.value).toBe('password123');
  });
});

