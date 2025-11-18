import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const ImportAssets = ({ isOpen, onClose, onImported }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview, 4: Results
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [validatedData, setValidatedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importResults, setImportResults] = useState({ success: [], errors: [] });
  const [isImporting, setIsImporting] = useState(false);
  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);

  // Campos disponibles para mapear
  const availableFields = {
    // Campos básicos
    name: { label: 'Nombre (requerido)', required: true, type: 'text' },
    codigo: { label: 'Código', required: false, type: 'text' },
    brand: { label: 'Marca', required: false, type: 'text' },
    model: { label: 'Modelo', required: false, type: 'text' },
    details: { label: 'Descripción', required: false, type: 'text' },
    serial_number: { label: 'Número de Serie', required: false, type: 'text' },
    assigned_to: { label: 'Asignado a', required: false, type: 'text' },
    category: { label: 'Categoría', required: false, type: 'text' },
    status: { label: 'Estado', required: false, type: 'text' },
    quantity: { label: 'Cantidad', required: false, type: 'number' },
    fecha_compra: { label: 'Fecha de Compra', required: false, type: 'date' },
    fecha_garantia: { label: 'Fecha de Garantía', required: false, type: 'date' },
    precio_compra: { label: 'Precio de Compra', required: false, type: 'number' },
    // Campos EPI
    supplier: { label: 'Proveedor (EPI)', required: false, type: 'text' },
    fabricante: { label: 'Fabricante (EPI)', required: false, type: 'text' },
    certificacion: { label: 'Certificación (EPI)', required: false, type: 'text' },
    maintenance_frequency: { label: 'Frecuencia Mantenimiento (días)', required: false, type: 'number' },
  };

  // Cargar categorías al abrir
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  // Parsear CSV
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };

    // Detectar delimitador (punto y coma es más común en Excel español, luego coma)
    // También detectar si hay BOM UTF-8 y eliminarlo
    const textWithoutBOM = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
    const delimiter = textWithoutBOM.includes(';') ? ';' : ',';
    
    // Parsear headers (usar textWithoutBOM para la primera línea también)
    const firstLine = lines[0].charCodeAt(0) === 0xFEFF ? lines[0].slice(1) : lines[0];
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Parsear datos
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.some(v => v)) { // Solo agregar si hay al menos un valor
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return { headers, data };
  };

  // Manejar subida de archivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, sube un archivo CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const { headers, data } = parseCSV(text);
        
        if (headers.length === 0 || data.length === 0) {
          toast.error('El archivo CSV está vacío o no tiene el formato correcto');
          return;
        }

        setCsvHeaders(headers);
        setCsvData(data);
        
        // Auto-mapear columnas si tienen nombres similares
        const autoMapping = {};
        headers.forEach(header => {
          const headerLower = header.toLowerCase();
          Object.keys(availableFields).forEach(field => {
            const fieldLabel = availableFields[field].label.toLowerCase();
            if (headerLower.includes(field) || fieldLabel.includes(headerLower) || 
                headerLower === field || headerLower === fieldLabel.split('(')[0].trim()) {
              if (!autoMapping[field]) {
                autoMapping[field] = header;
              }
            }
          });
        });

        setMapping(autoMapping);
        setStep(2);
        toast.success(`CSV cargado: ${data.length} filas encontradas`);
      } catch (error) {
        console.error('Error parseando CSV:', error);
        toast.error('Error al leer el archivo CSV');
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Validar datos
  const validateData = () => {
    const errors = [];
    const validated = [];

    csvData.forEach((row, index) => {
      const rowNum = index + 2; // +2 porque la fila 1 es el header
      const rowErrors = [];
      const validatedRow = { ...row, _rowNumber: rowNum };

      // Validar campo requerido: name
      if (!mapping.name || !row[mapping.name] || !row[mapping.name].trim()) {
        rowErrors.push('El campo "Nombre" es requerido');
      }

      // Validar categoría si existe
      if (mapping.category && row[mapping.category]) {
        const categoryName = row[mapping.category].trim();
        const categoryExists = categories.some(cat => 
          cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (!categoryExists) {
          rowErrors.push(`Categoría "${categoryName}" no existe. Se creará automáticamente.`);
        }
      }

      // Validar fechas
      if (mapping.fecha_compra && row[mapping.fecha_compra]) {
        const date = new Date(row[mapping.fecha_compra]);
        if (isNaN(date.getTime())) {
          rowErrors.push('Fecha de compra inválida');
        }
      }

      if (mapping.fecha_garantia && row[mapping.fecha_garantia]) {
        const date = new Date(row[mapping.fecha_garantia]);
        if (isNaN(date.getTime())) {
          rowErrors.push('Fecha de garantía inválida');
        }
      }

      // Validar números
      if (mapping.quantity && row[mapping.quantity]) {
        const qty = parseInt(row[mapping.quantity]);
        if (isNaN(qty) || qty < 1) {
          rowErrors.push('Cantidad debe ser un número mayor a 0');
        }
      }

      if (mapping.precio_compra && row[mapping.precio_compra]) {
        const price = parseFloat(row[mapping.precio_compra]);
        if (isNaN(price) || price < 0) {
          rowErrors.push('Precio de compra debe ser un número válido');
        }
      }

      if (mapping.maintenance_frequency && row[mapping.maintenance_frequency]) {
        const freq = parseInt(row[mapping.maintenance_frequency]);
        if (isNaN(freq) || freq < 1) {
          rowErrors.push('Frecuencia de mantenimiento debe ser un número mayor a 0');
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, errors: rowErrors, data: row });
      } else {
        validated.push(validatedRow);
      }
    });

    setValidationErrors(errors);
    setValidatedData(validated);
    setStep(3);
  };

  // Procesar importación
  const handleImport = async () => {
    setIsImporting(true);
    const success = [];
    const errors = [];

    // Procesar en lotes de 50 para no sobrecargar
    const batchSize = 50;
    for (let i = 0; i < validatedData.length; i += batchSize) {
      const batch = validatedData.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          // Mapear datos según el mapping
          const assetData = {};
          Object.keys(mapping).forEach(field => {
            const csvColumn = mapping[field];
            if (csvColumn && row[csvColumn] !== undefined && row[csvColumn] !== '') {
              let value = row[csvColumn].trim();
              
              // Convertir tipos según el campo
              if (availableFields[field].type === 'number') {
                value = field === 'precio_compra' ? parseFloat(value) : parseInt(value);
              } else if (availableFields[field].type === 'date') {
                // Asegurar formato de fecha
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  value = date.toISOString().split('T')[0];
                } else {
                  value = null;
                }
              }

              assetData[field] = value;
            }
          });

          // Valores por defecto
          if (!assetData.status) assetData.status = 'Activo';
          if (!assetData.quantity) assetData.quantity = 1;

          // Determinar si es EPI
          const isEPI = assetData.category && assetData.category.toLowerCase() === 'epi';

          if (isEPI) {
            // Generar código si no existe
            if (!assetData.codigo) {
              assetData.codigo = `EPI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            }

            // Insertar en epi_assets
            const { data, error } = await supabase
              .from('epi_assets')
              .insert([assetData])
              .select();

            if (error) throw error;
            success.push({ row: row._rowNumber, data: assetData, id: data[0]?.id });
          } else {
            // Insertar en assets
            const { data, error } = await supabase
              .from('assets')
              .insert([assetData])
              .select();

            if (error) throw error;
            success.push({ row: row._rowNumber, data: assetData, id: data[0]?.id });
          }

          // Crear categoría si no existe
          if (assetData.category) {
            const categoryName = assetData.category.trim();
            const categoryExists = categories.some(cat => 
              cat.name.toLowerCase() === categoryName.toLowerCase()
            );
            
            if (!categoryExists) {
              await supabase
                .from('categories')
                .insert([{ name: categoryName }])
                .select();
              // Actualizar lista de categorías
              await fetchCategories();
            }
          }

        } catch (error) {
          console.error(`Error importando fila ${row._rowNumber}:`, error);
          errors.push({ 
            row: row._rowNumber, 
            error: error.message || 'Error desconocido',
            data: row 
          });
        }
      }
    }

    setImportResults({ success, errors });
    setIsImporting(false);
    setStep(4);

    // Registrar en logs
    try {
      await supabase.from('system_logs').insert([{
        action: 'importacion_masiva',
        details: `Importados ${success.length} activos, ${errors.length} errores`,
        status: errors.length === 0 ? 'success' : 'warning'
      }]);
    } catch (e) {
      console.error('Error registrando log:', e);
    }

    if (errors.length === 0) {
      toast.success(`¡Importación exitosa! ${success.length} activos importados`);
      if (onImported) onImported();
    } else {
      toast.error(`Importación completada con errores: ${success.length} exitosos, ${errors.length} errores`);
    }
  };

  // Descargar plantilla CSV
  const downloadTemplate = () => {
    // Headers en orden lógico
    const headerOrder = [
      'name', 'codigo', 'brand', 'model', 'details', 
      'serial_number', 'assigned_to', 'category', 'status', 'quantity',
      'fecha_compra', 'fecha_garantia', 'precio_compra',
      'supplier', 'fabricante', 'certificacion', 'maintenance_frequency'
    ];
    
    // Crear headers con labels claros
    const headers = headerOrder.map(field => availableFields[field].label);
    
    // Ejemplos de datos bien estructurados
    const examples = [
      // Ejemplo 1: Activo electrónico normal
      [
        'Portátil Dell',                    // Nombre
        'ACT-001',                          // Código
        'Dell',                             // Marca
        'Latitude 5520',                    // Modelo
        'Ordenador portátil para oficina',  // Descripción
        'SN123456789',                      // Número de Serie
        'Juan Pérez',                       // Asignado a
        'Electrónica',                      // Categoría
        'Activo',                           // Estado
        '1',                                // Cantidad
        '2024-01-15',                       // Fecha de Compra
        '2025-01-15',                       // Fecha de Garantía
        '899.99',                           // Precio de Compra
        '',                                 // Proveedor (EPI) - vacío
        '',                                 // Fabricante (EPI) - vacío
        '',                                 // Certificación (EPI) - vacío
        ''                                  // Frecuencia Mantenimiento - vacío
      ],
      // Ejemplo 2: EPI
      [
        'Mascarilla FFP2',                  // Nombre
        'EPI-001',                          // Código
        '3M',                               // Marca
        'FFP2 N95',                         // Modelo
        'Mascarilla de protección respiratoria', // Descripción
        'SN789012',                         // Número de Serie
        'María García',                     // Asignado a
        'EPI',                              // Categoría
        'Activo',                           // Estado
        '10',                               // Cantidad
        '2024-01-10',                       // Fecha de Compra
        '2025-01-10',                       // Fecha de Garantía
        '5.50',                             // Precio de Compra
        'Proveedor XYZ',                    // Proveedor (EPI)
        'Fabricante ABC',                   // Fabricante (EPI)
        'CE',                               // Certificación (EPI)
        '90'                                // Frecuencia Mantenimiento (días)
      ],
      // Ejemplo 3: Mobiliario con cantidad
      [
        'Silla de Oficina',                 // Nombre
        'ACT-002',                          // Código
        'Herman Miller',                     // Marca
        'Aeron',                            // Modelo
        'Silla ergonómica para oficina',    // Descripción
        '',                                 // Número de Serie - vacío
        '',                                 // Asignado a - vacío
        'Mobiliario',                       // Categoría
        'Activo',                           // Estado
        '4',                                // Cantidad
        '2024-02-01',                       // Fecha de Compra
        '',                                 // Fecha de Garantía - vacío
        '450.00',                           // Precio de Compra
        '',                                 // Proveedor (EPI) - vacío
        '',                                 // Fabricante (EPI) - vacío
        '',                                 // Certificación (EPI) - vacío
        ''                                  // Frecuencia Mantenimiento - vacío
      ]
    ];
    
    // Construir contenido CSV usando punto y coma como delimitador (más compatible con Excel)
    const delimiter = ';';
    
    // Construir contenido CSV con delimitador punto y coma
    let csvContent = '\uFEFF'; // BOM UTF-8 para que Excel reconozca el encoding correctamente
    csvContent += headers.join(delimiter) + '\n';
    examples.forEach(example => {
      // Escapar valores que contengan punto y coma o comillas
      const escapedExample = example.map(value => {
        if (value === '') return '';
        // Si contiene punto y coma, comillas o saltos de línea, envolver en comillas
        if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
          return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      });
      csvContent += escapedExample.join(delimiter) + '\n';
    });
    
    // Agregar línea en blanco y nota informativa
    csvContent += '\n';
    csvContent += '"NOTA: El campo Nombre es obligatorio. Los demás campos son opcionales."\n';
    csvContent += '"Para EPIs, completa los campos de Proveedor, Fabricante y Certificación."\n';
    csvContent += '"Las fechas deben estar en formato YYYY-MM-DD (ejemplo: 2024-01-15)"\n';
    csvContent += '"Elimina estas líneas de nota antes de importar."\n';
    
    // Usar encoding UTF-8 con BOM para Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_importacion_activos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plantilla descargada');
  };

  // Resetear todo
  const handleReset = () => {
    setStep(1);
    setCsvData([]);
    setCsvHeaders([]);
    setMapping({});
    setValidatedData([]);
    setValidationErrors([]);
    setImportResults({ success: [], errors: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importación Masiva de Activos</h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 1 && 'Paso 1: Sube tu archivo CSV'}
              {step === 2 && 'Paso 2: Mapea las columnas'}
              {step === 3 && 'Paso 3: Revisa y valida'}
              {step === 4 && 'Paso 4: Resultados de la importación'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Paso 1: Subir archivo */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sube tu archivo CSV
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona un archivo CSV con los datos de los activos a importar
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Seleccionar archivo CSV
                </label>
                <p className="text-xs text-gray-500 mt-4">
                  O arrastra y suelta el archivo aquí
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-2">¿No tienes una plantilla?</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Descarga nuestra plantilla CSV con todos los campos disponibles y ejemplos.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Descargar Plantilla
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Mapeo de columnas */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Archivo cargado:</strong> {csvData.length} filas encontradas. 
                      Por favor, mapea cada columna de tu CSV con el campo correspondiente de la base de datos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {Object.keys(availableFields).map(field => (
                  <div key={field} className="flex items-center gap-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-gray-700">
                        {availableFields[field].label}
                        {availableFields[field].required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                    </div>
                    <div className="flex-1">
                      <select
                        value={mapping[field] || ''}
                        onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- No mapear --</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={validateData}
                  disabled={!mapping.name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Validar y Continuar
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Preview y validación */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-green-800">
                      <strong>Validación completada:</strong> {validatedData.length} filas válidas
                      {validationErrors.length > 0 && `, ${validationErrors.length} con errores`}
                    </p>
                  </div>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Errores encontrados:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {validationErrors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-800">
                        <strong>Fila {error.row}:</strong> {error.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-700 mt-2">
                    Las filas con errores no se importarán. Puedes corregir el CSV y volver a intentar.
                  </p>
                </div>
              )}

              {validatedData.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Preview de datos a importar (primeras 5 filas):</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fila</th>
                            {Object.keys(mapping).filter(f => mapping[f]).map(field => (
                              <th key={field} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {availableFields[field].label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {validatedData.slice(0, 5).map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm text-gray-500">{row._rowNumber}</td>
                              {Object.keys(mapping).filter(f => mapping[f]).map(field => (
                                <td key={field} className="px-4 py-2 text-sm text-gray-900">
                                  {row[mapping[field]] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {validatedData.length > 5 && (
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                        ... y {validatedData.length - 5} filas más
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleImport}
                  disabled={validatedData.length === 0 || isImporting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Importar {validatedData.length} activos
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Resultados */}
          {step === 4 && (
            <div className="space-y-6">
              <div className={`border rounded-lg p-4 ${
                importResults.errors.length === 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start">
                  {importResults.errors.length === 0 ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 mr-3" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Importación {importResults.errors.length === 0 ? 'Exitosa' : 'Completada con Errores'}
                    </h3>
                    <p className="text-sm text-gray-700">
                      <strong className="text-green-600">{importResults.success.length}</strong> activos importados correctamente
                      {importResults.errors.length > 0 && (
                        <>
                          , <strong className="text-red-600">{importResults.errors.length}</strong> con errores
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-3">Errores durante la importación:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {importResults.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-800 bg-white p-2 rounded">
                        <strong>Fila {error.row}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Importar Otro Archivo
                </button>
                <button
                  onClick={() => {
                    handleReset();
                    onClose();
                    if (onImported) onImported();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportAssets;

