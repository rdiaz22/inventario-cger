// src/api/upcItemDB.js
export async function fetchProductDataFromUPC(upc) {
    const API_KEY = '72379b9c444576507186f208e6c3d0de'; // reemplaza por tu clave de API
    const URL = `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`;
  
    try {
      const response = await fetch(URL, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'user_key': API_KEY,
        },
      });
  
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          title: item.title,
          brand: item.brand,
          description: item.description,
          image: item.images?.[0] || null,
          category: item.category || null,
        };
      }
      return null;
    } catch (error) {
      console.error('Error consultando UPCItemDB:', error);
      return null;
    }
  }
  