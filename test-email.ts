import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY?.trim() || ''
});

async function test() {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: "Welcome to Our Platform!",
      htmlContent: `<h3>Hi Test,</h3><p>Welcome to our platform!</p>`,
      textContent: `Hi Test,\n\nWelcome!`,
      sender: { 
        name: process.env.BREVO_FROM_NAME || 'Welcome', 
        email: process.env.BREVO_FROM_EMAIL || 'no-reply@example.com' 
      },
      to: [{ email: "test@example.com", name: "Test" }]
    });
    console.log('Success:', result);
  } catch (error: any) {
    console.error('Error:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }
}

test();
