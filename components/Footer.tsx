import React from 'react';

interface FooterProps {
  navigateTo: (page: 'home' | 'admin') => void;
}

const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-600">
        <p>&copy; 2025 Taimin. Todos os direitos reservados.</p>
        <div className="mt-2">
            <button 
              onClick={() => navigateTo('admin')} 
              className="text-sm text-primary-700 hover:underline focus:outline-none"
            >
              Painel do Administrador
            </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;