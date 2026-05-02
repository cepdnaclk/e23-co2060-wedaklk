import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({
  apiKey: (process.env.BREVO_API_KEY || '').trim()
});

export async function sendWelcomeEmail(toEmail: string, firstName: string) {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: "Welcome to Our Platform!",
      htmlContent: `<h3>Hi ${firstName},</h3><p>Welcome to our platform! We are thrilled to have you on board.</p><br /><p>Best Regards,<br />The Team</p>`,
      textContent: `Hi ${firstName},\n\nWelcome to our platform! We are thrilled to have you on board.\n\nBest Regards,\nThe Team`,
      sender: { 
        name: (process.env.BREVO_FROM_NAME || 'Welcome').trim(), 
        email: (process.env.BREVO_FROM_EMAIL || 'no-reply@example.com').trim() 
      },
      to: [{ email: toEmail, name: firstName }]
    });

    console.log(`Welcome email sent to ${toEmail}. Message ID: ${result?.messageId || 'unknown'}`);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email via Brevo:', error);
    // Depending on your requirements, you can throw the error or return false
    throw error;
  }
}
