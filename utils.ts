import { Order, CartItem, Customer } from './types';

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const getDosageForm = (productName: string): string | null => {
  const lowerCaseName = productName.toLowerCase();
  if (lowerCaseName.includes('jiaonang')) {
    return 'Cápsula';
  }
  if (lowerCaseName.includes('pian')) {
    return 'Comprimido';
  }
  if (lowerCaseName.includes('wan')) {
    return 'Pílula';
  }
  if (lowerCaseName.includes('spray')) {
    return 'Spray';
  }
  if (lowerCaseName.includes('tubo')) {
    return 'Pomada';
  }
  return null;
};

export const getOrders = (): Order[] => {
  try {
      const storedOrders = localStorage.getItem('orders');
      return storedOrders ? JSON.parse(storedOrders) : [];
  } catch (error) {
      console.error("Failed to load orders from local storage", error);
      return [];
  }
};

export const addOrder = (items: CartItem[], customer: Customer, totalPrice: number): boolean => {
  try {
      const orders = getOrders();
      const isExistingCustomer = orders.some(order => order.customer.cpf === customer.cpf);

      const newOrder: Order = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          customer,
          items,
          totalPrice,
          status: 'open',
          observation: '',
          isNewCustomer: !isExistingCustomer,
      };
      const updatedOrders = [...orders, newOrder];
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      return !isExistingCustomer; // Return true if it's a new customer
  } catch (error) {
      console.error("Failed to save order to local storage", error);
      return true; // Default to new customer message on error to be safe
  }
};

export const updateOrder = (updatedOrder: Order): void => {
  try {
      const orders = getOrders();
      const updatedOrders = orders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
  } catch (error) {
      console.error("Failed to update order in local storage", error);
  }
};