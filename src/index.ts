import type { CollectionSlug, Config } from 'payload'

import { customEndpointHandler } from './endpoints/customEndpointHandler.js'
import { umamiPageviewsHandler } from './endpoints/umamiPageviews.js'
import { umamiWebsitesHandler } from './endpoints/umamiWebsites.js'
import { UmamiClient } from './utils/umamiClient.js'

let umamiClient: null | UmamiClient = null
let umamiWebsiteId: string | null = null
export const getUmamiClient = () => umamiClient
export const getUmamiWebsiteId = () => umamiWebsiteId

export type PayloadcmsUmamiConfig = {
  /**
   * List of collections to add a custom field
   */
  collections?: Partial<Record<CollectionSlug, true>>
  disabled?: boolean
  /** Password for Umami login */
  password: string
  /**
   * Base URL of your Umami instance, e.g. https://analytics.example.com
   */
  umamiUrl: string
  /** Username for Umami login */
  username: string
  /** Website ID to display metrics for */
  websiteId?: string
}

export const payloadcmsUmami =
  (pluginOptions: PayloadcmsUmamiConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    config.collections.push({
      slug: 'plugin-collection',
      fields: [
        {
          name: 'id',
          type: 'text',
        },
      ],
    })

    if (pluginOptions.collections) {
      for (const collectionSlug in pluginOptions.collections) {
        const collection = config.collections.find(
          (collection) => collection.slug === collectionSlug,
        )

        if (collection) {
          collection.fields.push({
            name: 'addedByPlugin',
            type: 'text',
            admin: {
              position: 'sidebar',
            },
          })
        }
      }
    }

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    if (!config.admin.components.afterDashboard) {
      config.admin.components.afterDashboard = []
    }

    config.admin.components.beforeDashboard.push(
      `payloadcms-umami/client#BeforeDashboardClient`,
    )
    config.admin.components.beforeDashboard.push(
      `payloadcms-umami/rsc#BeforeDashboardServer`,
    )
    config.admin.components.afterDashboard.push(
      `payloadcms-umami/client#AfterDashboardClient`,
    )

    config.endpoints.push({
      handler: customEndpointHandler,
      method: 'get',
      path: '/my-plugin-endpoint',
    })

    config.endpoints.push({
      handler: umamiWebsitesHandler,
      method: 'get',
      path: '/umami-websites',
    })

    config.endpoints.push({
      handler: umamiPageviewsHandler,
      method: 'get',
      path: '/umami-pageviews',
    })

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }

      // Initialize Umami client
      umamiClient = new UmamiClient(
        pluginOptions.umamiUrl,
        pluginOptions.username,
        pluginOptions.password,
      )
      umamiWebsiteId = pluginOptions.websiteId || null

      try {
        await umamiClient.login()
      } catch (err) {
        payload.logger.error(`Failed to authenticate with Umami: ${String(err)}`)
      }

      const { totalDocs } = await payload.count({
        collection: 'plugin-collection',
        where: {
          id: {
            equals: 'seeded-by-plugin',
          },
        },
      })

      if (totalDocs === 0) {
        await payload.create({
          collection: 'plugin-collection',
          data: {
            id: 'seeded-by-plugin',
          },
        })
      }
    }

    return config
  }
