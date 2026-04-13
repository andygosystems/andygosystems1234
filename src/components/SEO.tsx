import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: string;
  schema?: Record<string, unknown>;
}

const SEO = ({ title, description, canonical, image, type = 'website', schema }: SEOProps) => {
  useEffect(() => {
    const fullTitle = `${title} | Krugerr Brendt Real Estate Kenya`;
    const siteUrl = 'https://krugerrbrendt.com';

    document.title = fullTitle;

    const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', 'Krugerr Brendt Real Estate');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);

    if (canonical) {
      const url = `${siteUrl}${canonical}`;
      upsertMeta('property', 'og:url', url);
      let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.href = url;
    }
    if (image) {
      upsertMeta('property', 'og:image', image);
      upsertMeta('name', 'twitter:image', image);
    }

    document.head.querySelector('#page-jsonld')?.remove();
    if (schema) {
      const s = document.createElement('script');
      s.id = 'page-jsonld';
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(schema);
      document.head.appendChild(s);
    }

    return () => {
      document.head.querySelector('#page-jsonld')?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, image, type]);

  return null;
};

export default SEO;
