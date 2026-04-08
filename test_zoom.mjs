const accountId = 'Your_Account_ID';
const clientId = 'Your_Client_ID';
const clientSecret = 'Your_Client_Secret';

async function testZoom() {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;

  console.log('Testing Zoom OAuth...');
  console.log('URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response Body:', text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('Access Token Length:', data.access_token?.length);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testZoom();
