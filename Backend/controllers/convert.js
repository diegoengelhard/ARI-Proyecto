const { generateJWT, decodeJWT } = require("../helpers/jwt");

const txtToJson = async (req, res) => {
  try {
    const { secret, txtcontent, delimiter } = req.body;

    // Separar las líneas del contenido de texto
    const lines = txtcontent.trim().split('\n');
    const parsedData = [];

    for (const line of lines) {
      if (line.trim()) {
        // Dividir cada línea usando el delimitador
        const fields = line.split(delimiter);
        
        if (fields.length >= 2) {
          // Asumir que el primer campo es el número de tarjeta de crédito
          const creditcard = fields[0].trim();
          
          // Generar JWT para el número de tarjeta
          const token = await generateJWT(creditcard, secret);
          
          // Crear objeto con el token y otros campos
          const dataObject = {
            token,
            originalData: fields.slice(1) // Resto de los campos
          };
          
          parsedData.push(dataObject);
        }
      }
    }

    res.json({
      ok: true,
      parsedData
    });

  } catch (error) {
    console.error('Error in txtToJson:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error processing the file'
    });
  }
};

const jsonToTxt = async (req, res) => {
  try {
    const { secret, parsedData, delimiter } = req.body;
    
    let output = '';

    for (const item of parsedData) {
      if (item.token) {
        try {
          // Decodificar el JWT para obtener el número de tarjeta original
          const decoded = await decodeJWT(item.token, secret);
          const creditcard = decoded.creditcard;
          
          // Reconstruir la línea original
          const line = [creditcard, ...(item.originalData || [])].join(delimiter);
          output += line + '\n';
          
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          // Si no se puede decodificar, agregar una línea con error
          output += `ERROR: Invalid token${delimiter}${(item.originalData || []).join(delimiter)}\n`;
        }
      }
    }

    res.json({
      ok: true,
      output: output.trim()
    });

  } catch (error) {
    console.error('Error in jsonToTxt:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error processing the JSON data'
    });
  }
};

module.exports = {
  txtToJson,
  jsonToTxt
};