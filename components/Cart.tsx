import React from 'react';
import { useCart } from '../context/CartContext';
import WhatsappIcon from './icons/WhatsappIcon';
import CloseIcon from './icons/CloseIcon';
import { CartItem } from '../types';
import { formatCurrency } from '../utils';

const Cart: React.FC = () => {
  const {
    isCartOpen,
    toggleCart,
    cartItems,
    removeFromCart,
    updateQuantity,
    totalPrice,
    openEmailModal,
  } = useCart();

  const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => (
    <div className="flex items-center space-x-4 py-4 border-b border-gray-200">
      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-md object-contain bg-white border border-gray-200 p-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-800 truncate" title={item.name}>{item.name}</h4>
        <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
        <div className="flex items-center border border-gray-200 rounded-md mt-2 w-fit">
            <button 
                onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                className="px-2 py-0.5 text-lg text-gray-700 hover:bg-gray-100 rounded-l-md transition-colors"
                aria-label="Diminuir quantidade"
            >-</button>
            <span className="w-10 text-center text-sm font-medium text-gray-800 bg-gray-50 py-0.5">{item.quantity}</span>
            <button 
                onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                className="px-2 py-0.5 text-lg text-gray-700 hover:bg-gray-100 rounded-r-md transition-colors"
                aria-label="Aumentar quantidade"
            >+</button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
        <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:underline mt-1">Remover</button>
      </div>
    </div>
  );

  return (
    <div
      className={`fixed top-0 right-0 h-full w-5/6 max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isCartOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex flex-col h-full">
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-primary-900">Meu Carrinho</h2>
          <button onClick={toggleCart} className="text-gray-500 hover:text-gray-800 transition-colors" aria-label="Fechar carrinho">
            <CloseIcon />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-4 h-full">
              <p className="text-gray-600">Seu carrinho está vazio.</p>
              <button onClick={toggleCart} className="mt-4 bg-primary-700 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-800 transition-colors">
                Ver Produtos
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="p-4">
                {cartItems.map((item) => <CartItemRow key={item.id} item={item} />)}
              </div>

              {/* Footer */}
              <footer className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <div className="text-right">
                      <span className="text-xl font-bold text-primary-800">{formatCurrency(totalPrice)}</span>
                      <p className="text-xs text-gray-500 -mt-1">+ frete</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={openEmailModal}
                    className="w-full bg-primary-700 text-white font-bold py-3 px-4 rounded-md hover:bg-primary-800 flex items-center justify-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <WhatsappIcon className="w-5 h-5" />
                    <span>Finalizar Compra</span>
                  </button>
                  <button
                    onClick={toggleCart}
                    className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  >
                    Continuar Comprando
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;