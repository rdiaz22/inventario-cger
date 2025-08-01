// /api/fetch-upc.js
export default async function handler(req, res) {
    const { upc } = req.query;
    const API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza por tu API KEY real
  
    if (!upc) {
      return res.status(400).json({ error: 'UPC no proporcionado' });
    }
  
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`;
  
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'user_key': API_KEY,
        },
      });
  
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Error en la API externa' });
      }
  
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error proxy UPC:', error);
      res.status(500).json({ error: 'Error en el servidor proxy' });
    }
  }
  