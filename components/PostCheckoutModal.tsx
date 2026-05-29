
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { isIOS } from '../utils';
import { WHATSAPP_NUMBER } from '../constants';
import WhatsappIcon from './icons/WhatsappIcon';

const PostCheckoutModal: React.FC = () => {
  const { clearCart, closePostCheckoutModal, postCheckoutMessage } = useCart();
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setIsIosDevice(isIOS());
  }, []);

  const handleNewOrder = () => {
    clearCart();
    closePostCheckoutModal();
  };

  const handleCopyToClipboard = () => {
    if (postCheckoutMessage) {
      navigator.clipboard.writeText(postCheckoutMessage).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
  };

  if (isIosDevice && postCheckoutMessage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full text-left transform transition-all">
          <h2 className="text-2xl font-bold text-primary-900 mb-4 text-center">Finalize seu Pedido no iOS</h2>
          <p className="text-gray-600 mb-6">Devido a restrições do iOS, o envio não é automático. Por favor, siga os passos abaixo:</p>
          <div className="space-y-4">
            <div>
              <label className="font-bold text-gray-800">Passo 1: Copie a mensagem do pedido</label>
              <textarea
                readOnly
                className="w-full h-32 mt-2 p-2 text-sm bg-gray-100 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                value={postCheckoutMessage}
              />
              <button
                onClick={handleCopyToClipboard}
                className={`mt-2 w-full text-white font-bold py-2 px-4 rounded-md transition-colors ${copySuccess ? 'bg-green-600' : 'bg-primary-700 hover:bg-primary-800'}`}
              >
                {copySuccess ? 'Copiado com Sucesso!' : 'Copiar Mensagem'}
              </button>
            </div>
            <div>
              <label className="font-bold text-gray-800">Passo 2: Abra o WhatsApp e envie</label>
              <button
                onClick={handleOpenWhatsApp}
                className="mt-2 w-full bg-[#25D366] text-white font-bold py-2 px-4 rounded-md hover:bg-[#1EBE57] transition-colors flex items-center justify-center gap-2"
              >
                <WhatsappIcon className="w-5 h-5"/>
                Abrir WhatsApp
              </button>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 flex flex-col gap-3">
             <button
              onClick={handleNewOrder}
              className="w-full bg-primary-700 text-white font-bold py-2 px-6 rounded-md hover:bg-primary-800 transition-colors"
            >
              Fazer um Novo Pedido
            </button>
             <button
                onClick={closePostCheckoutModal}
                className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md hover:bg-gray-300 transition-colors"
             >
                Continuar Comprando
             </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for non-iOS or when there is no specific message
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center transform transition-all">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">Pedido Quase Enviado!</h2>
        <p className="text-gray-600 mb-8">
          Sua mensagem de pedido está pronta no WhatsApp. <strong>Confirme o envio</strong> para abrir o WhatsApp e finalizar a compra.
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