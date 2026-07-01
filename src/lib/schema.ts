/**
 * Schema.org JSON-LD builders for ArchitectureLIVE.
 *
 * All builders take the site `origin` (e.g. "https://architecturelive.co.uk")
 * so they can emit absolute URLs and stable @id references. Output objects are
 * serialised by <JsonLd> into <script type="application/ld+json"> tags.
 *
 * - localBusinessSchema : sitewide practice identity (NAP, geo, founders, social)
 * - articleSchema       : per news article
 * - breadcrumbSchema    : per detail page (news + projects)
 */

/** Real, verified public profiles (mirrors the contact page). */
const SAME_AS = [
  "https://www.houzz.co.uk/pro/architecturelive/architecturelive",
  "https://www.homify.co.uk/professionals/2952/architecturelive",
  "https://www.linkedin.com/company/architecturelive",
  "https://www.instagram.com/architectureliveltd/",
];

/** The practice @id — referenced by author/publisher on articles. */
export const practiceId = (origin: string) => `${origin}/#practice`;

function person(name: string, jobTitle: string, origin: string) {
  return {
    "@type": "Person",
    name,
    jobTitle,
    worksFor: { "@id": practiceId(origin) },
  };
}

export function localBusinessSchema(origin: string) {
  const irene = person("Irene Konschill", "Architect, RIBA", origin);
  const jonathan = person("Jonathan Gratton", "Architect, RIBA", origin);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": practiceId(origin),
    name: "ArchitectureLIVE",
    alternateName: "ArchitectureLIVE Ltd",
    description:
      "Contemporary, sustainability-focused architecture practice in Haslemere, Surrey. RIBA Chartered architects working on extensions, new builds, education and commercial projects across Surrey, West Sussex and Hampshire.",
    url: `${origin}/`,
    logo: `${origin}/favicon-48.png`,
    image: `${origin}/og-default.jpg`,
    telephone: "+441428652018",
    email: "info@architecturelive.co.uk",
    foundingDate: "2009",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Tall Trees, The Cylinders, Fernhurst",
      addressLocality: "Haslemere",
      addressRegion: "Surrey",
      postalCode: "GU27 3EL",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 51.04695,
      longitude: -0.72434,
    },
    areaServed: [
      "Surrey",
      "West Sussex",
      "Hampshire",
      "Berkshire",
      "South Downs National Park",
    ].map((name) => ({ "@type": "AdministrativeArea", name })),
    knowsAbout: [
      "Architecture",
      "House extensions",
      "New build homes",
      "Passivhaus",
      "BREEAM",
      "Sustainable design",
      "Listed buildings",
    ],
    founder: irene,
    employee: [irene, jonathan],
    sameAs: SAME_AS,
  };
}

interface ArticleInput {
  origin: string;
  url: string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  section: string;
}

export function articleSchema(a: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    image: [a.image],
    datePublished: a.datePublished,
    dateModified: a.datePublished,
    articleSection: a.section,
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
    author: { "@type": "Organization", name: "ArchitectureLIVE", "@id": practiceId(a.origin) },
    publisher: {
      "@type": "Organization",
      name: "ArchitectureLIVE",
      "@id": practiceId(a.origin),
      logo: { "@type": "ImageObject", url: `${a.origin}/favicon-48.png` },
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
