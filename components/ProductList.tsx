
import React, { useState, useMemo } from 'react';
import { useProducts } from '../context/ProductContext';
import ProductCard from './ProductCard';
import SearchIcon from './icons/SearchIcon';

const ProductList: React.FC = () => {
  const { products, loading, error } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    if (products.length === 0) return [];
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    // Add 'all' to the list of categories
    return ['all', ...uniqueCategories.sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  if (error) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="max-w-2xl w-full bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-md" role="alert">
          <h3 className="text-xl font-bold mb-2">Erro de Conexão</h3>
          <p className="mb-4">O aplicativo não conseguiu se conectar ao banco de dados para buscar os produtos.</p>
          <p className="font-semibold">Possível Causa:</p>
          <p className="mb-4">As chaves de acesso ao Supabase (URL e Chave Pública) podem estar faltando ou incorretas.</p>
          <p className="font-semibold">Como Resolver:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Acesse as configurações (Settings) do seu projeto na Vercel.</li>
            <li>Vá para a seção <strong>Environment Variables</strong>.</li>
            <li>Verifique se as variáveis <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> existem e se seus valores estão corretos.</li>
            <li>Se você fez alguma alteração, faça um novo "Redeploy" para que as mudanças tenham efeito.</li>
          </ol>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        <p className="ml-4 text-gray-600">Carregando produtos...</p>
      </div>
    );
  }
  
  const inputBaseClasses = "w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-gray-100 text-gray-800 placeholder-gray-500";

  return (
    <div>
      {/* Filter and Search Section */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Input */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Produto
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                type="text"
                placeholder="Ex: Xiao Yao Wan"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`${inputBaseClasses} pl-10 pr-4 py-2`}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Categoria
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className={`${inputBaseClasses} p-2`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Todas as Categorias' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-700">Nenhum produto encontrado</h3>
          <p className="text-gray-500 mt-2">Tente ajustar seus filtros de busca.</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;