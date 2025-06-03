import type { PayloadHandler } from 'payload'

import { getUmamiClient } from '../index.js'

export const umamiWebsitesHandler: PayloadHandler = async () => {
  const client = getUmamiClient()
  if (!client) {
    return new Response('Umami not configured', { status: 500 })
  }

  const res = await client.fetch('/api/websites')
  const data = await res.json()
  return Response.json(data)
}
