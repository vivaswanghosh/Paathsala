/**
 * Auth0 Post-Login Action
 * Sends login events to your backend for security logging
 * 
 * Setup:
 * 1. Go to Auth0 Dashboard > Actions > Library > Create Action
 * 2. Select "Post Login" trigger
 * 3. Paste this code
 * 4. Add secrets: WEBHOOK_URL, WEBHOOK_SECRET
 * 5. Deploy and add to login flow
 */

const https = require('https');
const http = require('http');

exports.onExecutePostLogin = async (event) => {
  const webhookUrl = event.secrets.WEBHOOK_URL || 'https://your-backend.com/api/security/log';
  const webhookSecret = event.secrets.WEBHOOK_SECRET;

  const payload = {
    auth0Id: event.user.user_id,
    email: event.user.email,
    eventType: 'success',
    ipAddress: event.request.ip,
    userAgent: event.request.user_agent,
    auth0LogId: event.log?.log_id || null,
    city: event.request.geoip?.city_name || null,
    country: event.request.geoip?.country_name || null
  };

  try {
    await sendWebhook(webhookUrl, webhookSecret, payload);
    console.log('Login event logged successfully');
  } catch (error) {
    console.error('Failed to log login event:', error.message);
  }
};

function sendWebhook(url, secret, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret
      }
    };

    const protocol = isHttps ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}
