// Apollo.io People Search API Client

export class ApolloClient {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPeople(params: {
    q_organization_domains?: string[];
    person_titles?: string[];
    person_locations?: string[];
    per_page?: number;
    page?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/mixed_people/api_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': this.apiKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Apollo API error: ${response.status}`);
    }

    return response.json();
  }

  async enrichPerson(email: string) {
    const response = await fetch(`${this.baseUrl}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`Apollo API error: ${response.status}`);
    }

    return response.json();
  }
}
