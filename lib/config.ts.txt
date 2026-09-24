// One place to rebrand the store for each client.
export const store = {
  name: 'Elevate',
  tagline: 'Curated fashion, delivered across Kenya',
  currency: 'KES',
  locale: 'en-KE',
  city: 'Mombasa',
  email: 'hello@elevate.co.ke',
  // digits only, country code first (e.g. 2547XXXXXXXX). Override in Vercel env.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '254700000000',
  deliveryFee: 300,
  freeDeliveryThreshold: 5000,
}

export const serif = { fontFamily: 'var(--font-serif)' } as const
