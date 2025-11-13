import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText, getByTestId } = render(
      <RegisterScreen navigation={mockNavigation} route={mockRoute} />
    );

    // 'auth.register' appears in both Appbar title and Button
    expect(getAllByText('auth.register').length).toBeGreaterThan(0);
    expect(getByTestId('label-auth.email')).toBeTruthy();
    expect(getByTestId('label-auth.password')).toBeTruthy();
  });

  it('allows user to enter email', () => {
    const { getByTestId } = render(
      <RegisterScreen navigation={mockNavigation} route={mockRoute} />
    );

    const emailInput = getByTestId('input-auth.email');
    fireEvent.changeText(emailInput, 'test@example.com');
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('allows user to enter password', () => {
    const { getByTestId } = render(
      <RegisterScreen navigation={mockNavigation} route={mockRoute} />
    );

    const passwordInput = getByTestId('input-auth.password');
    fireEvent.changeText(passwordInput, 'password123');
    expect(passwordInput.props.value).toBe('password123');
  });
});

