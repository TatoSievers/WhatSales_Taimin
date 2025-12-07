
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Footer from './components/Footer';
import Admin from './components/Admin';
import { useCart } from './context/CartContext';
import PostCheckoutModal from './components/PostCheckoutModal';
import CheckoutEmailModal from './components/CheckoutEmailModal';
import AdminLogin from './components/AdminLogin';
import { supabase } from './lib/supabaseClient';

const HomePage = () => (
  <>
    <h1 className="text-3xl font-bold text-primary-900 mb-8">Canal de venda exclusiva para prescritores</h1>
    <ProductList />
  </>
);

function App() {
  const { isCartOpen, showPostCheckoutModal, isEmailModalOpen, toggleCart } = useCart();
  const [currentPage, setCurrentPage] = useState<'home' | 'admin'>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminAuthenticated(!!session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminAuthenticated(!!session);
    });

    if (isCartOpen) {
      document.body.classList.add('cart-open');
    } else {
      document.body.classList.remove('cart-open');
    }

    return () => {
      document.body.classList.remove('cart-open');
      subscription.unsubscribe();
    };
  }, [isCartOpen]);

  const navigateTo = (page: 'home' | 'admin') => {
    setCurrentPage(page);
    // Reset auth state if navigating away from admin
    if (page !== 'admin') {
      setIsAdminAuthenticated(false);
    }
  };

  const renderAdminPage = () => {
    if (isAdminAuthenticated) {
      return <Admin />;
    }
    return <AdminLogin onAuthSuccess={() => setIsAdminAuthenticated(true)} />;
  };

  return (
    <div className="relative min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Overlay for cart on mobile */}
      {isCartOpen && (
        <div
          onClick={toggleCart}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCartOpen ? 'lg:mr-[28rem]' : ''}`}>
        <Header navigateTo={navigateTo} />
        <main className="flex-grow container mx-auto px-4 py-8">
          {currentPage === 'admin' ? renderAdminPage() : <HomePage />}
        </main>
        <Footer navigateTo={navigateTo} />
      </div>
      <Cart />
      {isEmailModalOpen && <CheckoutEmailModal />}
      {showPostCheckoutModal && <PostCheckoutModal />}
    </div>
  );
}

export default App;
