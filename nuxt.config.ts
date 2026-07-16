export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@vercel/analytics'],
  // Prerendered pages here carry no async payload, and the Vercel preset does not
  // emit /_payload.json into the static output under mixed prerender + ISR rules,
  // which 404s on the client. Disable extraction; ISR pages inline their data instead.
  experimental: { payloadExtraction: false },
  routeRules: {
    // Home is fully static — prerendered at build time and served from the CDN edge.
    '/': { prerender: true },
    // Preview pages use ISR: rendered once, cached at the edge for an hour,
    // regenerated in the background after that.
    '/i/**': { isr: 3600 },
  },
  app: {
    head: {
      title: 'GoodImg — Drop an image, get a link',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Fast, free image hosting. No account needed.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },
})
