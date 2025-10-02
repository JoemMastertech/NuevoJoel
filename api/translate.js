/**
 * Translation API Endpoint
 * Handles secure communication with Google Translate API
 * This file should be deployed as a serverless function (Netlify/Vercel) or Node.js server
 */

// For Netlify Functions
export async function handler(event, context) {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text, targetLanguage, sourceLanguage = 'es' } = JSON.parse(event.body);

    // Validate input
    if (!text || !targetLanguage) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters: text, targetLanguage' })
      };
    }

    // Get Google Translate API key from environment variables
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      console.error('Google Translate API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Translation service not configured' })
      };
    }

    // Call Google Translate API
    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
    const response = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
        format: 'text'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Translate API error:', errorData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Translation service error' })
      };
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        translatedText,
        sourceLanguage,
        targetLanguage,
        originalText: text
      })
    };

  } catch (error) {
    console.error('Translation endpoint error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

// For Express.js server (alternative implementation)
export function createTranslateEndpoint(app) {
  app.post('/api/translate', async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage = 'es' } = req.body;

      // Validate input
      if (!text || !targetLanguage) {
        return res.status(400).json({ 
          error: 'Missing required parameters: text, targetLanguage' 
        });
      }

      // Get Google Translate API key from environment variables
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
      if (!apiKey) {
        console.error('Google Translate API key not configured');
        return res.status(500).json({ 
          error: 'Translation service not configured' 
        });
      }

      // Call Google Translate API
      const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
      
      const response = await fetch(translateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Google Translate API error:', errorData);
        return res.status(500).json({ 
          error: 'Translation service error' 
        });
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;

      res.json({
        translatedText,
        sourceLanguage,
        targetLanguage,
        originalText: text
      });

    } catch (error) {
      console.error('Translation endpoint error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}