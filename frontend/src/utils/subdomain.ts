const APP_DOMAIN = (import.meta.env.VITE_APP_DOMAIN as string | undefined) ?? 'localhost'

/** Returns the org slug from the subdomain, or null if on the root domain. */
export function getOrgSlug(): string | null {
  const hostname = window.location.hostname
  const baseDomain = APP_DOMAIN.split(':')[0] // strip port if present

  if (hostname === baseDomain || hostname === `www.${baseDomain}`) return null

  const suffix = `.${baseDomain}`
  if (hostname.endsWith(suffix)) {
    const slug = hostname.slice(0, -suffix.length)
    if (slug && !slug.includes('.')) return slug
  }

  return null
}

/** Builds a full URL for an org's subdomain. */
export function buildOrgUrl(orgSlug: string, path = ''): string {
  const baseDomain = APP_DOMAIN
  const { protocol, port } = window.location
  const portSuffix = port ? `:${port}` : ''
  return `${protocol}//${orgSlug}.${baseDomain}${portSuffix}${path}`
}