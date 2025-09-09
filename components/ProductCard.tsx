import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency, getDosageForm, isPromoActive } from '../utils';
import ProductDetailModal from './ProductDetailModal';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(product.price);
  const dosageForm = getDosageForm(product.name);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isOutOfStock = product.visibility === 'out_of_stock';

  const promoIsActive = isPromoActive(product);
  const effectivePrice = promoIsActive && product.promoPrice ? product.promoPrice : product.price;
  const showDetails = product.action || product.indication;

  useEffect(() => {
    setTotalPrice(effectivePrice * quantity);
  }, [quantity, effectivePrice]);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    // Pass a product object with the price "locked-in" at the time of adding to cart.
    addToCart({ ...product, price: effectivePrice }, quantity);
    setQuantity(1);
  };

  const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col">
        <div 
            onClick={() => showDetails && setIsModalOpen(true)}
            className={`relative w-full h-56 bg-white p-2 flex items-center justify-center ${showDetails ? 'cursor-pointer' : ''}`}
            role={showDetails ? 'button' : undefined}
            tabIndex={showDetails ? 0 : -1}
            onKeyDown={(e) => {
              if (showDetails && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setIsModalOpen(true);
              }
            }}
            aria-label={showDetails ? `Ver detalhes de ${product.name}` : undefined}
        >
          {promoIsActive && (
             <span className="absolute top-3 left-3 bg-red-600 text-white text-base font-bold py-1 px-4 rounded-full shadow-lg z-10 transform -rotate-12">
              PROMO
            </span>
          )}
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-30' : ''}`}
          />
          {isOutOfStock && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-sm font-bold py-1 px-4 rounded-md shadow-lg transform -rotate-12 select-none">
              ESGOTADO
            </span>
          )}
          {showDetails && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex flex-col items-center justify-center space-y-2 p-4">
                <InfoIcon />
                <span className="text-white text-center text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Ver Detalhes
                </span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-md font-semibold text-gray-800 truncate mb-1" title={product.name}>
            {product.name}
          </h3>
          {product.quantityInfo && (
            <p className="text-xs text-gray-500 font-medium mb-2">{product.quantityInfo}</p>
          )}
          <div className="flex items-center gap-2 mb-4">
              <p className="text-sm text-gray-500">{product.category}</p>
              {dosageForm && (
                  <span className="inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {dosageForm}
                  </span>
              )}
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center space-x-2 mb-4">
              <label className="text-sm font-medium text-gray-700">Qtd:</label>
              <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-1 text-lg font-semibold text-gray-700 hover:bg-gray-100 rounded-l-md transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      aria-label="Diminuir quantidade"
                      disabled={isOutOfStock}
                  >-</button>
                  <span className="w-12 text-center font-medium text-gray-800 bg-gray-50 py-1">{quantity}</span>
                  <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="px-3 py-1 text-lg font-semibold text-gray-700 hover:bg-gray-100 rounded-r-md transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      aria-label="Aumentar quantidade"
                      disabled={isOutOfStock}
                  >+</button>
              </div>
            </div>

            <div className="mb-4 min-h-[56px]">
              {promoIsActive ? (
                <>
                  <p className="text-sm text-gray-500 line-through">{formatCurrency(product.price * quantity)}</p>
                  <p className="text-xl font-bold text-red-600 -mt-1">{formatCurrency(totalPrice)}</p>
                </>
              ) : (
                <p className="text-xl font-bold text-primary-800">{formatCurrency(totalPrice)}</p>
              )}
              <p className="text-xs text-gray-500 -mt-1">+ frete</p>
            </div>
            
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary-700 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Esgotado' : 'Adicionar ao Carrinho'}
            </button>
          </div>
        </div>
      </div>
      {isModalOpen && <ProductDetailModal product={product} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default ProductCard;