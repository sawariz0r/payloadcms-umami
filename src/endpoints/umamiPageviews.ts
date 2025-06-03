import type { PayloadHandler } from 'payload'

import { getUmamiClient, getUmamiWebsiteId } from '../index.js'

export const umamiPageviewsHandler: PayloadHandler = async () => {
  const client = getUmamiClient()
  const websiteId = getUmamiWebsiteId()

  if (!client || !websiteId) {
    return new Response('Umami not configured', { status: 500 })
  }

  const endAt = Date.now()
  const startAt = endAt - 24 * 60 * 60 * 1000
  const res = await client.fetch(
    `/api/websites/${websiteId}/metrics?type=pageviews&startAt=${startAt}&endAt=${endAt}`,
  )

  if (!res.ok) {
    return new Response('Failed to fetch pageviews', { status: res.status })
  }

  const data = await res.json()

  // The API returns { pageviews: number } or { metrics: [...] }, depend on version
  const pageviews = data?.pageviews ?? data?.metrics?.reduce((sum: number, m: any) => sum + Number(m.y), 0)

  return Response.json({ pageviews })
}
