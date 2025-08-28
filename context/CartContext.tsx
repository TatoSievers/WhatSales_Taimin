import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { Product, CartItem, CartContextType, Customer } from '../types';
import { WHATSAPP_NUMBER } from '../constants';
import { formatCurrency, addOrder } from '../utils';


const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showPostCheckoutModal, setShowPostCheckoutModal] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const addToCart = useCallback((product: Product, quantity: number) => {
    if (quantity <= 0) return;
    setCartItems(prevItems => {
      const exist = prevItems.find(item => item.id === product.id);
      if (exist) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
    if (!isCartOpen) {
      setIsCartOpen(true);
    }
  }, [isCartOpen]);

  const removeFromCart = useCallback((productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  // Post-checkout modal
  const openPostCheckoutModal = useCallback(() => {
    setIsCartOpen(false);
    setShowPostCheckoutModal(true);
  }, []);

  const closePostCheckoutModal = useCallback(() => {
    setShowPostCheckoutModal(false);
  }, []);
  
  // Email modal
  const openEmailModal = useCallback(() => {
    if (cartItems.length > 0) {
      setIsEmailModalOpen(true);
    }
  }, [cartItems.length]);

  const closeEmailModal = useCallback(() => {
    setIsEmailModalOpen(false);
  }, []);

  const handleFinalCheckout = useCallback(async (customer: Customer) => {
    const totalPriceValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Save order to Supabase and check if customer is new
    const isNewCustomer = await addOrder(cartItems, customer, totalPriceValue);
    
    const itemsText = cartItems
      .map(
        (item) =>
          `  - ${item.name} (${item.quantity}x) - ${formatCurrency(item.price * item.quantity)}`
      )
      .join('\n');

    const subject = "[Pedido Taimin] - não responda";
    const emailBody = `Olá, ${customer.name}.

Confirmamos o recebimento do seu pedido. Ele está em processo de análise e em breve nossa equipe entrará em contato com mais detalhes.

**Resumo do Pedido:**
${itemsText}

**Total:** ${formatCurrency(totalPriceValue)}

Para um atendimento mais rápido ou para tirar dúvidas, você pode nos contatar diretamente pelo WhatsApp: ${WHATSAPP_NUMBER}.

Agradecemos a sua preferência.

Atenciosamente,
Equipe Taimin`;

    // --- Simulação de Envio de E-mail ---
    console.log("--- SIMULAÇÃO DE E-MAIL ---");
    console.log(`Para: ${customer.email}`);
    console.log(`Cópia para: mtc@taimin.com.br`);
    console.log(`Assunto: ${subject}`);
    console.log(`Corpo:\n${emailBody}`);
    console.log("----------------------------");
    // --- Fim da Simulação ---
    
    const closingMessage = isNewCustomer
      ? 'Aguardo as instruções para cadastramento*, pagamento e entrega.\n*venda mediante aprovação de cadastro'
      : 'Cadastro válido, Aguardo as instruções para pagamento e entrega.';

    const whatsappMessage = `Olá! Meu nome é ${customer.name} (CPF: ${customer.cpf}) e gostaria de fazer o seguinte pedido:\n\n${itemsText}\n\n*Total: ${formatCurrency(totalPriceValue)}*\n\n${closingMessage}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    
    window.open(url, '_blank');
    
    closeEmailModal();
    openPostCheckoutModal();

  }, [cartItems, closeEmailModal, openPostCheckoutModal]);


  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isCartOpen,
    toggleCart,
    showPostCheckoutModal,
    openPostCheckoutModal,
    closePostCheckoutModal,
    isEmailModalOpen,
    openEmailModal,
    closeEmailModal,
    handleFinalCheckout
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, toggleCart, showPostCheckoutModal, openPostCheckoutModal, closePostCheckoutModal, isEmailModalOpen, openEmailModal, closeEmailModal, handleFinalCheckout]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};