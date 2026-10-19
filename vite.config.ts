import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // B21 Faz 2: teslim dosyası SDK'ları yalnızca sınıf modülüyle (tembel) yüklensin;
              // aksi halde 'firebase' ve 'docx' genel eşleşmelerine yakalanıp açılış bundle'ına girerler
              if (id.includes('firebase') && id.includes('storage')) {
                return 'vendor-storage';
              }
              // B21 Faz 2 Kesim E: functions SDK yalnızca ClassroomPanel akışında (tembel) kullanılıyor;
              // 'firebase' genel eşlemesine düşerse açılış modulepreload'una girer (vendor-firebase eager)
              if (id.includes('firebase') && id.includes('functions')) {
                return 'vendor-functions';
              }
              if (id.includes('pdfjs-dist')) {
                return 'vendor-pdfjs';
              }
              // mammoth'un alt bağımlılıkları (jszip, xmldom vb.) aksi halde vendor-core'a düşer
              if (
                id.includes('mammoth') ||
                /[\\/]node_modules[\\/](jszip|@xmldom[\\/]xmldom|argparse|base64-js|dingbat-to-unicode|lop|underscore|xmlbuilder)[\\/]/.test(id)
              ) {
                return 'vendor-mammoth';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-framer';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('onnxruntime')) {
                return 'vendor-onnx';
              }
              if (id.includes('docx')) {
                return 'vendor-docx';
              }
              if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('micromark') || id.includes('mdast')) {
                return 'vendor-markdown';
              }
              if (id.includes('@xenova/transformers')) {
                return 'vendor-transformers';
              }
              if (
                /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)
              ) {
                return 'vendor-react';
              }
              return 'vendor-core';
            }
          }
        }
      }
    }
  };
});
