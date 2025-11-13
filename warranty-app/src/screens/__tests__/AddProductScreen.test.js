import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddProductScreen from '../AddProductScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
};

describe('AddProductScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText, getByTestId } = render(
      <AddProductScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Appbar.Content and Button both render 'product.addProduct'
    expect(getAllByText('product.addProduct').length).toBeGreaterThan(0);
    expect(getByTestId('label-product.productName *')).toBeTruthy();
  });

  it('displays product name input', () => {
    const { getByTestId } = render(
      <AddProductScreen navigation={mockNavigation} route={mockRoute} />
    );

    const productNameLabel = getByTestId('label-product.productName *');
    expect(productNameLabel).toBeTruthy();
  });

  it('allows user to enter product name', () => {
    const { getByTestId } = render(
      <AddProductScreen navigation={mockNavigation} route={mockRoute} />
    );

    const productNameInput = getByTestId('input-product.productName *');
    fireEvent.changeText(productNameInput, 'Test Product');
    expect(productNameInput.props.value).toBe('Test Product');
  });

  it('displays purchase date input', () => {
    const { getByTestId } = render(
      <AddProductScreen navigation={mockNavigation} route={mockRoute} />
    );

    const dateLabel = getByTestId('label-product.purchaseDate (YYYY-MM-DD) *');
    expect(dateLabel).toBeTruthy();
  });

  it('displays price input', () => {
    const { getByTestId } = render(
      <AddProductScreen navigation={mockNavigation} route={mockRoute} />
    );

    const priceLabel = getByTestId('label-product.price (RSD)');
    expect(priceLabel).toBeTruthy();
  });
});

