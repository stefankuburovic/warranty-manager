import React from 'react';
import { render } from '@testing-library/react-native';
import EditProductScreen from '../EditProductScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {
    productId: 1,
    product: {
      product_id: 1,
      product_name: 'Test Product',
      brand: 'Test Brand',
      purchase_date: '2024-01-01',
      purchase_price: 100,
    },
  },
};

describe('EditProductScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText, getByTestId } = render(
      <EditProductScreen navigation={mockNavigation} route={mockRoute} />
    );

    // 'product.editProduct' appears in both Appbar title and Button
    expect(getAllByText('product.editProduct').length).toBeGreaterThan(0);
    expect(getByTestId('label-product.productName *')).toBeTruthy();
  });

  it('displays product name', () => {
    const { getByTestId } = render(
      <EditProductScreen navigation={mockNavigation} route={mockRoute} />
    );

    const productNameInput = getByTestId('input-product.productName *');
    expect(productNameInput.props.value).toBe('Test Product');
  });
});

