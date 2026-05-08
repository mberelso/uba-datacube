import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Umweltpuls'
const SITE_URL = 'https://www.umweltpuls.de'
const DEFAULT_DESCRIPTION = 'Aktuelle Umweltdaten für Deutschland — interaktiv aufbereitet auf Basis des UBA-Datacubes. Klimadaten, Emissionstrends und Umweltindikatoren.'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`

interface SEOProps {
  title?: string
  description?: string
  path?: string
  image?: string
}

export function SEO({ title, description = DEFAULT_DESCRIPTION, path = '', image = DEFAULT_IMAGE }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Aktuelle Umweltdaten Deutschland`
  const url = `${SITE_URL}${path}`

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
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="de_DE" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
