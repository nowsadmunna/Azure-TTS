import { testAzureConnection } from '../services/azureService.js';

/**
 * Health check endpoint
 */
export function handleHealthCheck(req, res) {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

/**
 * Azure service connectivity test
 */
export async function handleAzureTest(req, res) {
  try {
    const result = await testAzureConnection();
    res.json(result);
  } catch (error) {
    console.error('❌ Azure test failed:', error.message);
    res.status(500).json({ 
      status: 'Azure connection failed',
      error: error.message
    });
  }
}
