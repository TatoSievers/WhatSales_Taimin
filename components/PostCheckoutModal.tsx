import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { isIOS } from '../utils';
import WhatsappIcon from './icons/WhatsappIcon';

const PostCheckoutModal: React.FC = () => {
  const { clearCart, closePostCheckoutModal } = useCart();
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    // We check this on the client side, so it runs after mounting
    setIsIosDevice(isIOS());
  }, []);


  const handleNewOrder = () => {
    clearCart();
    closePostCheckoutModal();
  };
  
  const title = isIosDevice ? "Ação Necessária no WhatsApp" : "Pedido Quase Enviado!";
  const message = isIosDevice 
    ? "Seu pedido foi preparado. Para finalizar, <strong>vá para o WhatsApp e pressione ENVIAR</strong> na mensagem que preparamos para você."
    : "Sua mensagem de pedido está pronta no WhatsApp. <strong>Confirme o envio</strong> para abrir o WhatsApp e finalizar a compra.";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center transform transition-all">
        {isIosDevice && (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-5">
            <WhatsappIcon className="h-8 w-8 text-green-600" />
          </div>
        )}
        <h2 className="text-2xl font-bold text-primary-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8" dangerouslySetInnerHTML={{ __html: message }} />
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
