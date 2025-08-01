export async function fetchProductDataFromUPC(upc) {
  const URL = `/api/fetch-upc?upc=${upc}`;

  try {
    const response = await fetch(URL);
    
    if (response.status === 429) {
      console.warn('⚠️ Demasiadas solicitudes a la API. Esperando...');
      return null;
    }
    
    if (!response.ok) {
      console.error('Error en la respuesta de la API:', response.status);
      return null;
    }

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