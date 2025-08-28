import React from 'react';
import { useCart } from '../context/CartContext';

const PostCheckoutModal: React.FC = () => {
  const { clearCart, closePostCheckoutModal } = useCart();

  const handleNewOrder = () => {
    clearCart();
    closePostCheckoutModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center transform transition-all">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">Pedido Enviado!</h2>
        <p className="text-gray-600 mb-8">
          Seu pedido foi encaminhado para o WhatsApp. Para finalizar, basta enviar a mensagem. O que deseja fazer agora?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleNewOrder}
            className="w-full sm:w-auto bg-primary-700 text-white font-bold py-2 px-6 rounded-md hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Iniciar Nova Compra
          </button>
          <button
            onClick={closePostCheckoutModal}
            className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCheckoutModal;