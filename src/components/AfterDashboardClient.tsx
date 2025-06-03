'use client'
import { useConfig } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export const AfterDashboardClient = () => {
  const { config } = useConfig()
  const [pageviews, setPageviews] = useState<number | null>(null)

  useEffect(() => {
    const fetchPageviews = async () => {
      try {
        const res = await fetch(
          `${config.serverURL}${config.routes.api}/umami-pageviews`,
        )
        if (!res.ok) throw new Error('request failed')
        const data = await res.json()
        setPageviews(data.pageviews)
      } catch (err) {
        console.error('Failed to load pageviews', err)
      }
    }

    void fetchPageviews()
  }, [config])

  return (
    <div>
      <h2>Page views last 24 hours: {pageviews ?? 'Loading...'}</h2>
    </div>
  )
}
