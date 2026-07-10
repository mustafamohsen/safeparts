interface Env {
  ASSETS: Fetcher
}

const helpSlashRedirects = new Set(['/help', '/help/ar'])

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (shouldRedirectToTrailingSlash(request, url)) {
      url.pathname = `${url.pathname}/`
      return Response.redirect(url.toString(), 301)
    }

    const assetResponse = await env.ASSETS.fetch(request)
    if (assetResponse.status !== 404 || !isPageRequest(request)) {
      return assetResponse
    }

    if (url.pathname.startsWith('/help/')) {
      return helpNotFoundResponse(request, env, url)
    }

    return env.ASSETS.fetch(new Request(new URL('/index.html', url), request))
  },
} satisfies ExportedHandler<Env>

function shouldRedirectToTrailingSlash(request: Request, url: URL): boolean {
  return isPageRequest(request) && helpSlashRedirects.has(url.pathname)
}

function isPageRequest(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false
  }

  const accept = request.headers.get('Accept') ?? ''
  return accept.includes('text/html') || accept.includes('*/*')
}

async function helpNotFoundResponse(request: Request, env: Env, url: URL): Promise<Response> {
  const notFoundResponse = await env.ASSETS.fetch(
    new Request(new URL('/help/404.html', url), request),
  )

  return new Response(notFoundResponse.body, {
    headers: notFoundResponse.headers,
    status: 404,
    statusText: 'Not Found',
  })
}
