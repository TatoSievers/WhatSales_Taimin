import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [
        react(),
        {
          name: 'save-config-middleware',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              if (req.url === '/api/save-whatsapp-config' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  try {
                    const data = JSON.parse(body);
                    const { whatsappNumber, whatsappMessageTemplate, whatsappReceiverName } = data;
                    
                    const constantsPath = path.resolve(__dirname, 'constants.ts');
                    const fileContent = `export const WHATSAPP_NUMBER = "${whatsappNumber.replace(/"/g, '\\"')}";\nexport const WHATSAPP_RECEIVER_NAME = "${whatsappReceiverName.replace(/"/g, '\\"')}";\nexport const WHATSAPP_MESSAGE_TEMPLATE = "${whatsappMessageTemplate.replace(/"/g, '\\"').replace(/\n/g, '\\n')}";\n`;
                    fs.writeFileSync(constantsPath, fileContent);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                  } catch (err: any) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                  }
                });
              } else {
                next();
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
