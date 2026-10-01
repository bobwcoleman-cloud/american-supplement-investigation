// netlify/functions/dsld-proxy.js
// Proxy DSLD API calls to avoid CORS issues

export const handler = async (event) => {
  const { query } = event.queryStringParameters || {};

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing query parameter' })
    };
  }

  try {
    const response = await fetch(
      `https://api.ods.od.nih.gov/dsld/v9/products?query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
