/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'maplibre-gl/dist/maplibre-gl-worker.mjs?url' {
  const src: string;
  export default src;
}
