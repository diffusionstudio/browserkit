export const PORT = process.env.PORT || 3000;
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const CHROME_ARGS = process.env.CHROME_ARGS?.split(' ') || [];
export const API_KEY = process.env.API_KEY;
export const CHROME_PATH = process.env.CHROME_PATH;

console.log('ENVIRONMENT VARIABLES:');
console.log('======================');
console.log('PORT:', PORT);
console.log('CHROME_PATH:', CHROME_PATH);
console.log('CHROME_ARGS:', CHROME_ARGS);

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY.slice(0, 4) + '...');
}

if (API_KEY) {
  console.log('API_KEY:', API_KEY.slice(0, 4) + '...');
}
