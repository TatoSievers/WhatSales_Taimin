import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency, getDosageForm, isPromoActive } from '../utils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(product.price);
  const dosageForm = getDosageForm(product.name);
  const isOutOfStock = product.visibility === 'out_of_stock';

  const promoIsActive = isPromoActive(product);
  const effectivePrice = promoIsActive && product.promoPrice ? product.promoPrice : product.price;

  useEffect(() => {
    setTotalPrice(effectivePrice * quantity);
  }, [quantity, effectivePrice]);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    // Pass a product object with the price "locked-in" at the time of adding to cart.
    addToCart({ ...product, price: effectivePrice }, quantity);
    setQuantity(1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
      <div 
          className="relative w-full h-56 bg-white p-2 flex items-center justify-center"
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
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-gray-800 truncate mb-1" title={product.name}>
          {product.name}
        </h3>
        {product.quantityInfo && (
          <p className="text-xs text-gray-500 font-medium mb-2">{product.quantityInfo}</p>
        )}
        <div className="flex items-center gap-2 mb-3">
            <p className="text-sm text-gray-500">{product.category}</p>
            {dosageForm && (
                <span className="inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {dosageForm}
                </span>
            )}
        </div>
        
        {/* All product info directly on the card */}
        {(product.action || product.indication) && (
            <div className="my-3 text-sm text-gray-600 space-y-2 border-t border-b border-gray-100 py-3">
            {product.action && (
                <div>
                    <strong className="font-semibold text-gray-800">Ação:</strong> {product.action}
                </div>
            )}
            {product.indication && (
                <div>
                    <strong className="font-semibold text-gray-800">Indicação:</strong> {product.indication}
                </div>
            )}
            </div>
        )}
        
        <div className="mt-auto pt-2">
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
  );
};

export default ProductCard;