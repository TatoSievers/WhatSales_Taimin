
export interface Product {
  id: number;
  name: string;
  price: number;
  promoPrice?: number | null;
  promoStartDate?: string | null;
  promoEndDate?: string | null;
  imageUrl: string;
  category: string;
  action?: string;
  indication?: string;
  quantityInfo?: string;
  visibility: 'in_stock' | 'out_of_stock' | 'hidden';
}

export type NewProduct = Omit<Product, 'id'>;

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  name: string;
  email: string;
  cpf: string;
}

export interface Order {
  id: string;
  date: string;
  customer: Customer;
  items: CartItem[];
  totalPrice: number;
  status: 'open' | 'completed';
  observation: string;
  customerStatus: 'pending' | 'registered';
}

export interface ProductContextType {
  products: Product[];
  addProduct: (product: NewProduct) => Promise<void>;
  updateProduct: (productId: number, updates: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  applyBulkPromotion: (discountPercent: number | null, startDate: string | null, endDate: string | null) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  toggleCart: () => void;
  // Post-checkout flow
  showPostCheckoutModal: boolean;
  postCheckoutMessage: string | null;
  openPostCheckoutModal: (message?: string) => void;
  closePostCheckoutModal: () => void;
  // Email modal flow
  isEmailModalOpen: boolean;
  openEmailModal: () => void;
  closeEmailModal: () => void;
  handleFinalCheckout: (customer: Customer) => void;
}

export interface PopupConfig {
  text: string;
  expiresAt: string | null;
  active: boolean;
}