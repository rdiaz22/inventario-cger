import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const Topbar = () => {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // O redirige a login
  };

  return (
    <header className="w-full bg-gray-200 px-6 py-3 flex justify-between items-center border-b border-gray-300 shadow-sm">
      <div className="text-lg font-semibold text-gray-700">
        Inventario de Activos
      </div>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-sm text-gray-600">{userEmail}</span>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
};

export default Topbar;

