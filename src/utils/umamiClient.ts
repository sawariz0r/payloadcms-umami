export type LoginResponse = {
  token: string
}

export class UmamiClient {
  private token: null | string = null
  constructor(
    private url: string,
    private username: string,
    private password: string,
  ) {}

  async fetch(path: string, init?: RequestInit): Promise<Response> {
    if (!this.token) {
      throw new Error('Umami client not authenticated')
    }

    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${this.token}`)

    return fetch(`${this.url}${path}`, {
      ...init,
      headers,
    })
  }

  async login(): Promise<void> {
    const res = await fetch(`${this.url}/api/auth/login`, {
      body: JSON.stringify({ password: this.password, username: this.username }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    })

    if (!res.ok) {
      throw new Error(`Umami login failed: ${res.status}`)
    }

    const data: LoginResponse = await res.json()
    this.token = data.token
  }
}
