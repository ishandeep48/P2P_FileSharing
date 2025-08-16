import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs';

export default defineConfig({
  server: {
    host: '0.0.0.0',  
    port: 3000,       
    https: {
      key: readFileSync('./key.pem'),
      cert: readFileSync('./cert.pem')
    }
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
});