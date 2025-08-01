// src/api/upc.js
export default async function handler(req, res) {
    const { code } = req.query;
  
    if (!code) return res.status(400).json({ error: 'Código no proporcionado' });
  
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Error al consultar la API externa' });
      }
  
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Error interno al hacer fetch' });
    }
  }
  