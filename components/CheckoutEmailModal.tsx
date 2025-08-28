
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import CloseIcon from './icons/CloseIcon';
import { Customer } from '../types';

const CheckoutEmailModal: React.FC = () => {
  const { closeEmailModal, handleFinalCheckout } = useCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get only digits from the input value
    const digitsOnly = e.target.value.replace(/\D/g, '');

    // Limit to 11 digits
    const limitedDigits = digitsOnly.slice(0, 11);
    
    // Apply formatting
    let formattedCpf = limitedDigits;
    if (limitedDigits.length > 9) {
      formattedCpf = `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9)}`;
    } else if (limitedDigits.length > 6) {
      formattedCpf = `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6)}`;
    } else if (limitedDigits.length > 3) {
      formattedCpf = `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3)}`;
    }
    
    setCpf(formattedCpf);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !cpf.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Por favor, insira um e-mail válido.');
        return;
    }
    if (cpf.replace(/\D/g, '').length !== 11) {
      setError('O CPF deve conter 11 dígitos.');
      return;
    }
    setError('');
    const customer: Customer = { name, email, cpf };
    handleFinalCheckout(customer);
  };
  
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-gray-100 text-gray-800 placeholder-gray-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full text-left transform transition-all relative">
        <button onClick={closeEmailModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold text-primary-900 mb-2">Quase lá!</h2>
        <p className="text-gray-600 mb-6">
          Precisamos de alguns dados para confirmar seu pedido.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" name="name" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
            </div>
             <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input 
                type="tel" 
                name="cpf" 
                id="cpf" 
                value={cpf} 
                onChange={handleCpfChange} 
                className={inputClass} 
                placeholder="000.000.000-00"
                required 
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="pt-2">
                <button
                    type="submit"
                    className="w-full bg-primary-700 text-white font-bold py-3 px-4 rounded-md hover:bg-primary-800 flex items-center justify-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    Confirmar e Enviar Pedido
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutEmailModal;