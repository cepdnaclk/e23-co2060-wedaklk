/**
 * PayPal REST API helpers (server-side only)
 * Uses PayPal Orders v2 API with OAuth2 authentication
 */

const PAYPAL_API_BASE = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Get an OAuth2 access token from PayPal
 */
export async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('PayPal auth error:', errorData);
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a PayPal order
 */
export async function createOrder(params: {
  amountUsd: string;
  description: string;
  customId?: string;
}): Promise<{ id: string; status: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: params.amountUsd,
          },
          description: params.description,
          custom_id: params.customId || undefined,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('PayPal create order error:', errorData);
    throw new Error('Failed to create PayPal order');
  }

  const data = await response.json();
  return { id: data.id, status: data.status };
}

/**
 * Capture a PayPal order (after buyer approval)
 */
export async function captureOrder(orderId: string): Promise<{
  status: string;
  captureId: string;
  amount: string;
  currency: string;
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('PayPal capture error:', errorData);

    // If the order was already captured (e.g. from a duplicate request), 
    // fetch the order details and return the capture info from there.
    if (errorData.includes('ORDER_ALREADY_CAPTURED')) {
      console.log('Order already captured, fetching order details...');
      const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        const capture = orderData.purchase_units?.[0]?.payments?.captures?.[0];
        
        if (capture) {
          return {
            status: orderData.status,
            captureId: capture.id || '',
            amount: capture.amount?.value || '0',
            currency: capture.amount?.currency_code || 'USD',
          };
        }
      }
    }

    throw new Error('Failed to capture PayPal payment');
  }

  const data = await response.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    status: data.status,
    captureId: capture?.id || '',
    amount: capture?.amount?.value || '0',
    currency: capture?.amount?.currency_code || 'USD',
  };
}
