
import React from 'react';
import { Product } from '../types';
import CloseIcon from './icons/CloseIcon';
import { getDosageForm } from '../utils';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const dosageForm = getDosageForm(product.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full text-left transform transition-all relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10" aria-label="Fechar">
            <CloseIcon />
        </button>
        <div className="grid md:grid-cols-2">
            <div className="p-4 bg-gray-50 flex items-center justify-center border-r border-gray-200">
                 <img src={product.imageUrl} alt={product.name} className="w-full h-auto max-h-96 object-contain" />
            </div>
            <div className="p-6 flex flex-col">
                 <h2 className="text-2xl font-bold text-primary-900 mb-2">{product.name}</h2>
                 {product.quantityInfo && (
                    <p className="text-md text-gray-600 mb-2">{product.quantityInfo}</p>
                 )}
                 <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm text-gray-500">{product.category}</p>
                    {dosageForm && (
                        <span className="inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {dosageForm}
                        </span>
                    )}
                </div>

                {product.action && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 text-md">Ação:</h3>
                        <p className="text-gray-600">{product.action}</p>
                    </div>
                )}

                {product.indication && (
                     <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 text-md">Indicação:</h3>
                        <p className="text-gray-600">{product.indication}</p>
                    </div>
                )}
                 
                 <div className="mt-auto pt-4">
                    <button onClick={onClose} className="w-full bg-primary-700 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-800 transition-colors">
                        Fechar
                    </button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;