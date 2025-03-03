export const CHROME_SECURITY_FLAGS = [
  '--incognito',                     // Ensures fresh session
  '--disable-dev-shm-usage',         // Prevents excessive memory use in /dev/shm
  '--renderer-process-limit=3',      // Limits renderer processes (prevents high RAM usage)
  '--js-flags="--max_old_space_size=3072"', // Limits JavaScript heap memory to 3GB
  '--disable-background-networking', // Reduces background memory usage
  '--disable-sync',                  // Prevents syncing (reduces memory footprint)
  '--disable-extensions',            // Prevents high-memory extension usage
  '--disable-password-generation',   // Prevents password generation
  '--disable-save-password-bubble',  // Prevents saving password bubble
  '--disable-autofill',              // Prevents autofill
  '--disable-translate',             // Prevents translation
  '--disable-ftp',                   // Prevents FTP
];
export const METADATA_URL = 'http://metadata.google.internal/computeMetadata/v1';
export const METADATA_HEADERS = { 'Metadata-Flavor': 'Google' };
