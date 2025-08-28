
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency, getDosageForm } from '../utils';
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

  useEffect(() => {
    setTotalPrice(product.price * quantity);
  }, [quantity, product.price]);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setQuantity(1);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col">
        <div className="relative w-full h-56 bg-white p-2 flex items-center justify-center">
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

            <div className="mb-4">
              <p className="text-xl font-bold text-primary-800">{formatCurrency(totalPrice)}</p>
              <p className="text-xs text-gray-500 -mt-1">+ frete</p>
            </div>
            
            {(product.action || product.indication) && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full text-center text-primary-700 font-semibold py-2 px-4 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors text-sm mb-2"
              >
                Ver Detalhes
              </button>
            )}

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