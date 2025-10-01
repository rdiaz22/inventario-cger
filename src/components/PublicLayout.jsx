import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo_inventario_app.png';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header público */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Logo" className="h-8 w-8" />
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Inventario
              </h1>
            </div>

            {/* Botón de acceso administrativo */}
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Acceso Administrativo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer público */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 Sistema de Inventario. Acceso público a información de activos.</p>
            <p className="mt-1">
              Para gestión completa del sistema,{' '}
              <Link to="/admin/login" className="text-blue-600 hover:underline">
                accede al panel administrativo
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
