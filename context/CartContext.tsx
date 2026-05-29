import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { Product, CartItem, CartContextType, Customer } from '../types';
import { formatCurrency, addOrder, isIOS, getWhatsappConfig } from '../utils';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showPostCheckoutModal, setShowPostCheckoutModal] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [postCheckoutMessage, setPostCheckoutMessage] = useState<string | null>(null);

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
  const openPostCheckoutModal = useCallback((message?: string) => {
    if (typeof message === 'string') {
      setPostCheckoutMessage(message);
    }
    setIsCartOpen(false);
    setShowPostCheckoutModal(true);
  }, []);

  const closePostCheckoutModal = useCallback(() => {
    setShowPostCheckoutModal(false);
    setPostCheckoutMessage(null);
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

    const whatsappConfig = await getWhatsappConfig();
    const whatsappNum = whatsappConfig.whatsappNumber;
    const receiverName = whatsappConfig.whatsappReceiverName;
    const messageTemplate = whatsappConfig.whatsappMessageTemplate;

    // Save order to Supabase and get the customer's registration status
    const { customerStatus } = await addOrder(cartItems, customer, totalPriceValue, receiverName);
    
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

Para um atendimento mais rápido ou para tirar dúvidas, você pode nos contatar diretamente pelo WhatsApp: ${whatsappNum}.

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
    
    const closingMessage = customerStatus === 'pending'
      ? 'Aguardo as instruções para cadastramento*, pagamento e entrega.\n*venda mediante aprovação de cadastro'
      : 'Cadastro válido, Aguardo as instruções para pagamento e entrega.';

    const whatsappMessage = messageTemplate
      .replace(/{nome}/g, customer.name)
      .replace(/{cpf}/g, customer.cpf)
      .replace(/{itens}/g, itemsText)
      .replace(/{total}/g, formatCurrency(totalPriceValue))
      .replace(/{mensagem_fechamento}/g, closingMessage);
    
    closeEmailModal();
    
    if (isIOS()) {
      openPostCheckoutModal(whatsappMessage);
    } else {
      const url = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(url, '_blank');
      openPostCheckoutModal();
    }
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
    postCheckoutMessage,
    openPostCheckoutModal,
    closePostCheckoutModal,
    isEmailModalOpen,
    openEmailModal,
    closeEmailModal,
    handleFinalCheckout
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, toggleCart, showPostCheckoutModal, postCheckoutMessage, openPostCheckoutModal, closePostCheckoutModal, isEmailModalOpen, openEmailModal, closeEmailModal, handleFinalCheckout]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};