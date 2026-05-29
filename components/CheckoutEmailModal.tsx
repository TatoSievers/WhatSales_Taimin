
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import CloseIcon from './icons/CloseIcon';
import { Customer } from '../types';

const CheckoutEmailModal: React.FC = () => {
  const { closeEmailModal, handleFinalCheckout } = useCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [registro, setRegistro] = useState('');
  const [profissao, setProfissao] = useState('');
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const limitedDigits = digitsOnly.slice(0, 11);
    
    let formattedPhone = limitedDigits;
    if (limitedDigits.length > 10) {
      formattedPhone = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
    } else if (limitedDigits.length > 6) {
      formattedPhone = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
    } else if (limitedDigits.length > 2) {
      formattedPhone = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
    } else if (limitedDigits.length > 0) {
      formattedPhone = `(${limitedDigits}`;
    }
    setPhone(formattedPhone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !cpf.trim() || !phone.trim() || !registro.trim() || !profissao.trim()) {
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
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Por favor, insira um telefone válido com DDD.');
      return;
    }
    setError('');
    const customer: Customer = { 
      name, 
      email, 
      cpf, 
      phone, 
      registro, 
      profissao 
    };
    handleFinalCheckout(customer);
  };
  
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-gray-100 text-gray-800 placeholder-gray-500 text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-lg w-full text-left transform transition-all relative">
        <button onClick={closeEmailModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold text-primary-900 mb-2">Quase lá!</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Como este é um canal exclusivo para prescritores, precisamos dos seus dados profissionais para processar seu pedido.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">Nome Completo</label>
              <input type="text" name="name" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                <input type="email" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Telefone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  id="phone" 
                  value={phone} 
                  onChange={handlePhoneChange} 
                  className={inputClass} 
                  placeholder="(00) 00000-0000"
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cpf" className="block text-xs font-semibold text-gray-700 mb-1">CPF</label>
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
              <div>
                <label htmlFor="registro" className="block text-xs font-semibold text-gray-700 mb-1">Reg. Profissional (CRM/CRN/CRF...)</label>
                <input 
                  type="text" 
                  name="registro" 
                  id="registro" 
                  value={registro} 
                  onChange={e => setRegistro(e.target.value)} 
                  className={inputClass} 
                  placeholder="Ex: CRM-SP 12345"
                  required 
                />
              </div>
            </div>

            <div>
              <label htmlFor="profissao" className="block text-xs font-semibold text-gray-700 mb-1">Profissão / Especialidade</label>
              <select 
                name="profissao" 
                id="profissao" 
                value={profissao} 
                onChange={e => setProfissao(e.target.value)} 
                className={inputClass}
                required
              >
                <option value="">Selecione sua profissão...</option>
                <option value="Acupunturista">Acupunturista / Terapeuta MTC</option>
                <option value="Médico">Médico (MTC / Outros)</option>
                <option value="Nutricionista">Nutricionista</option>
                <option value="Farmacêutico">Farmacêutico</option>
                <option value="Fisioterapeuta">Fisioterapeuta</option>
                <option value="Veterinário">Veterinário</option>
                <option value="Estudante">Estudante de MTC</option>
                <option value="Outro">Outro Profissional de Saúde</option>
              </select>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <div className="pt-2">
                <button
                    type="submit"
                    className="w-full bg-primary-700 text-white font-bold py-3 px-4 rounded-md hover:bg-primary-800 flex items-center justify-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
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