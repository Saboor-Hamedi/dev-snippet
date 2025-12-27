/**
 * GitHub Service
 * Handles direct interaction with GitHub API
 */

const GITHUB_API_BASE = 'https://api.github.com'

class GitHubService {
  constructor() {
    this.token = null
  }

  setToken(token) {
    console.log('[GitHubService] setToken called, new token length:', token ? token.length : 'NULL')
    this.token = token
  }

  getHeaders() {
    if (!this.token) {
      throw new Error('GitHub Token not set')
    }

    // Validate token format
    const isClassicToken = this.token.startsWith('ghp_')
    const isFineGrainedToken = this.token.startsWith('github_pat_')

    if (!isClassicToken && !isFineGrainedToken) {
      console.warn(
        '[GitHubService] Token does not start with ghp_ or github_pat_ - might be invalid'
      )
    }

    // Debug log to catch "Bad credentials" cause
    console.log(
      '[GitHubService] Making request with token:',
      this.token.substring(0, 6) + '...' + this.token.substring(this.token.length - 4),
      'Length:',
      this.token.length,
      'Type:',
      isClassicToken ? 'Classic' : isFineGrainedToken ? 'Fine-grained' : 'Unknown'
    )

    // Fine-grained tokens require 'Bearer', classic tokens use 'token'
    const authPrefix = isFineGrainedToken ? 'Bearer' : 'token'

    return {
      Authorization: `${authPrefix} ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Electron-Dev-Snippet-App'
    }
  }

  /**
   * Validate the token by fetching the user profile
   */
  async getUser() {
    try {
      const response = await fetch(`${GITHUB_API_BASE}/user`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid Token')
        throw new Error(`GitHub API Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (e) {
      console.error('GitHubService: getUser failed', e)
      throw e
    }
  }

  /**
   * List user's gists to find our backup gist
   */
  async findGistByDescription(descriptionSignature) {
    try {
      // Fetch user's gists (defaults to public + secret)
      // Increase limit to 100 to increase chance of finding it
      // And add cache buster
      const response = await fetch(`${GITHUB_API_BASE}/gists?per_page=100&ts=${Date.now()}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        let errText = ''
        try {
          errText = await response.text()
        } catch (_) {}
        throw new Error(
          `Failed to list gists: ${response.status} ${response.statusText} - ${errText}`
        )
      }

      const gists = await response.json()
      // Find the one that matches our specific description
      return gists.find((g) => g.description === descriptionSignature)
    } catch (e) {
      console.error('GitHubService: findGist failed', e)
      throw e
    }
  }

  /**
   * Create a new backup Gist
   */
  async createGist(description, files, isPublic = false) {
    try {
      const payload = {
        description,
        public: isPublic,
        files
      }

      const response = await fetch(`${GITHUB_API_BASE}/gists`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        let errText = ''
        try {
          errText = await response.text()
        } catch (_) {}
        throw new Error(
          `Failed to create gist: ${response.status} ${response.statusText} - ${errText}`
        )
      }
      return await response.json()
    } catch (e) {
      console.error('GitHubService: createGist failed', e)
      throw e
    }
  }

  /**
   * Update an existing Gist
   */
  async updateGist(gistId, files) {
    try {
      const payload = { files }

      const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        let errText = ''
        try {
          errText = await response.text()
        } catch (_) {}
        throw new Error(
          `Failed to update gist: ${response.status} ${response.statusText} - ${errText}`
        )
      }
      return await response.json()
    } catch (e) {
      console.error('GitHubService: updateGist failed', e)
      throw e
    }
  }

  /**
   * Get specific gist content
   */
  async getGist(gistId) {
    try {
      const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        let errText = ''
        try {
          errText = await response.text()
        } catch (_) {}
        throw new Error(
          `Failed to get gist: ${response.status} ${response.statusText} - ${errText}`
        )
      }
      return await response.json()
    } catch (e) {
      console.error('GitHubService: getGist failed', e)
      throw e
    }
  }
}

export default new GitHubService()
