import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Umweltpuls'
const SITE_URL = 'https://www.umweltpuls.de'
const DEFAULT_DESCRIPTION = 'Klimadaten, Emissionstrends und Umweltindikatoren des Umweltbundesamts — interaktiv erkunden, filtern und exportieren. Kostenlos und offen.'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

const WEBSITE_JSONLD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: 'de-DE',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/catalog?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
})

interface SEOProps {
  title?: string
  description?: string
  path?: string
  image?: string
  jsonLd?: object | object[]
}

export function SEO({ title, description = DEFAULT_DESCRIPTION, path = '', image = DEFAULT_IMAGE, jsonLd }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Umweltdaten Deutschland interaktiv`
  const url = `${SITE_URL}${path}`

  // Automatic BreadcrumbList Schema
  const breadcrumbs: Array<{ '@type': string; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'Startseite', item: SITE_URL }
  ]
  if (path === '/catalog') {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Datenkatalog', item: url })
  } else if (path === '/vergleich') {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Datenvergleich', item: url })
  } else if (path === '/hitze') {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Hitze in Deutschland', item: url })
  } else if (path === '/wind') {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Windkraft-Ausbau', item: url })
  } else if (path === '/solar') {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Solar-Ausbau', item: url })
  } else if (path.startsWith('/dataset/')) {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Datenkatalog', item: `${SITE_URL}/catalog` })
    breadcrumbs.push({ '@type': 'ListItem', position: 3, name: title ?? 'Datensatz', item: url })
  }

  const breadcrumbJsonLd = breadcrumbs.length > 1 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs,
  } : null

  const schemas: object[] = []
  if (jsonLd) {
    if (Array.isArray(jsonLd)) schemas.push(...jsonLd)
    else schemas.push(jsonLd)
  } else if (path === '') {
    schemas.push(JSON.parse(WEBSITE_JSONLD))
  }
  if (breadcrumbJsonLd) schemas.push(breadcrumbJsonLd)

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title ?? SITE_NAME} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="de_DE" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemas.map((schema, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}
