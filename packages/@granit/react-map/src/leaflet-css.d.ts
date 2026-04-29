// Side-effect import declaration for the Leaflet stylesheet. Bundlers
// (Vite, webpack, esbuild) consume the CSS via their asset pipeline; this
// declaration just satisfies the TypeScript type-checker.
declare module 'leaflet/dist/leaflet.css';
