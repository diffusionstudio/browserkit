import os from 'os';

export const PORT = process.env.PORT || 3000;
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const CHROME_ARGS = process.env.CHROME_ARGS?.split(' ') || [];
export const CHROME_PATH = process.env.CHROME_PATH;
export const MAX_BROWSER_INSTANCES = Math.max(os.cpus().length - 1, 1, parseInt(process.env.MAX_BROWSER_INSTANCES || '0'))
export const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;

console.log('ENVIRONMENT VARIABLES:');
console.log('======================');
console.log('PORT:', PORT);
console.log('CHROME_PATH:', CHROME_PATH);
console.log('CHROME_ARGS:', CHROME_ARGS);
console.log('MAX_BROWSER_INSTANCES:', MAX_BROWSER_INSTANCES);
console.log('GCP_PROJECT_ID:', GCP_PROJECT_ID);

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY.slice(0, 4) + '...');
}
