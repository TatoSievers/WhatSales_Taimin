import React, { useState } from 'react';

interface AdminLoginProps {
  onAuthSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onAuthSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // A senha agora é lida de uma variável de ambiente segura (através do helper de compatibilidade)
  const getAdminPassword = () => {
    try {
      return (import.meta as any).env.VITE_ADMIN_PASSWORD || (process as any).env?.VITE_ADMIN_PASSWORD || 'admin';
    } catch (e) {
      return 'admin';
    }
  };
  
  const adminPassword = getAdminPassword();
  const isDemoMode = adminPassword === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === adminPassword) {
      setError('');
      onAuthSuccess();
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Acesso Restrito</h1>
          <p className="mt-2 text-gray-600">
            Esta página é protegida. Por favor, insira a senha para continuar.
          </p>
        </div>

        {isDemoMode && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs leading-relaxed">
            <span className="font-semibold block mb-1">Modo de Demonstração Local</span>
            A variável de ambiente <code className="bg-amber-100 px-1 rounded">VITE_ADMIN_PASSWORD</code> não está definida.
            Use a senha padrão <strong className="underline font-bold">admin</strong> para acessar o painel.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="sr-only"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-gray-100 text-gray-800"
              placeholder="Senha"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Acessar Painel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;