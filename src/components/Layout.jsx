import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, onCategoriasClick }) => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar onCategoriasClick={onCategoriasClick} />
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Contenido de la página */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
