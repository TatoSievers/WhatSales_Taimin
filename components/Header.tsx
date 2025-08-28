
import React from 'react';
import { useCart } from '../context/CartContext';
import CartIcon from './icons/CartIcon';

interface HeaderProps {
  navigateTo: (page: 'home' | 'admin') => void;
}

const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
  const { totalItems, toggleCart } = useCart();

  return (
    <header className="bg-white shadow-md sticky top-0 z-30 border-b border-gray-200">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <a onClick={() => navigateTo('home')} className="cursor-pointer" aria-label="Página Inicial">
            <img 
              src="https://res.cloudinary.com/dqg7yc1du/image/upload/v1753963017/Logo_TMC_mnj699.png"
              alt="Taimin Logo" 
              className="h-14" 
            />
        </a>
        <button
          onClick={toggleCart}
          className="relative text-gray-600 hover:text-primary-800 transition-colors"
          aria-label="Abrir carrinho"
        >
          <CartIcon />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
