import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Découpe en plusieurs chunks pour que les libs externes soient mises en cache
    // séparément du code applicatif → après une mise à jour du site, le navigateur ne
    // recharge que le code modifié, pas les libs (recharts, xlsx, lucide…).
    rollupOptions: {
      output: {
        manualChunks: {
          // React + son écosystème (très stable)
          "vendor-react": ["react", "react-dom"],
          // Supabase (stable)
          "vendor-supabase": ["@supabase/supabase-js"],
          // Icônes (volumineux mais rare changement)
          "vendor-icons": ["lucide-react"],
          // Export Excel (gros : 200ko) — utilisé uniquement à l'export
          "vendor-xlsx": ["xlsx"],
        },
      },
    },
    // Limite la taille des chunks avant warning (cosmétique)
    chunkSizeWarningLimit: 800,
  },
});
