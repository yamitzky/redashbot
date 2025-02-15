import axios from 'axios'

type QueryResult = {
  query_result: {
    data: {
      rows: Record<string, any>[]
      columns: { friendly_name: string; type: string; name: string }[]
    }
  }
}
type Query = {
  visualizations: Visualization[]
  name: string
}
type Visualization = {
  id: number
  name: string
}
type Dashboard = {
  name: string
  public_url: string
}

export class Redash {
  host: string
  apiKey: string
  alias: string
  headers?: Record<string, string>

  constructor({
    host,
    apiKey,
    alias,
    headers,
  }: {
    host: string
    apiKey: string
    alias: string
    headers?: Record<string, string>
  }) {
    this.alias = alias
    this.host = host
    this.apiKey = apiKey
    this.headers = headers
  }

  private getRequestConfig({
    headers = {},
    params = {},
  }: { headers?: Record<string, any>; params?: Record<string, any> } = {}) {
    return {
      params: {
        api_key: this.apiKey,
        ...params,
      },
      headers: {
        ...this.headers,
        ...headers,
      },
    }
  }

  async getQuery(id: string): Promise<Query> {
    const res = await axios.get(`${this.alias}/api/queries/${id}`, this.getRequestConfig())
    return res.data
  }

  async getQueryResult(id: string): Promise<QueryResult> {
    const res = await axios.get(`${this.alias}/api/queries/${id}/results.json`, this.getRequestConfig())
    return res.data
  }

  async getDashboardLegacy(idOrSlug: string): Promise<Dashboard> {
    const res = await axios.get(
      `${this.alias}/api/dashboards/${idOrSlug}`,
      this.getRequestConfig({ params: { legacy: true } }),
    )
    return res.data
  }

  async getDashboard(id: string): Promise<Dashboard> {
    const res = await axios.get(`${this.alias}/api/dashboards/${id}`, this.getRequestConfig())
    return res.data
  }
}
