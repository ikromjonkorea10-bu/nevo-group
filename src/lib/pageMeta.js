// NEVO GROUP — Dynamic Page Metadata, Canonical & Hreflang SEO Engine
import { getCatalog, getProductBySlug, getCategoryBySlug, getLocalizedCategoryName, getLocalizedCategoryDesc } from './catalog.js';
import { getLang, formatProductCount } from './i18n.js';

const SITE_ORIGIN = 'https://nevogroup.uz';

const TITLES = {
  uz: {
    home: "NEVO GROUP — Santexnika va Qurilish Mollari Ombordan",
    catalog: "Mahsulotlar Katalogi — NEVO GROUP",
    tanlash: "Mahsulot Tanlash Bo'yicha Yordam — NEVO GROUP",
    'katta-buyurtma': "Katta Qurilish Buyurtmasi — NEVO GROUP",
    savat: "Xarid Savati — NEVO GROUP",
    aloqa: "Biz Bilan Bog'lanish va Ombor Manzili — NEVO GROUP",
  },
  ru: {
    home: "NEVO GROUP — Сантехника и строительные товары со склада",
    catalog: "Каталог продукции — NEVO GROUP",
    tanlash: "Помощь в подборе оборудования — NEVO GROUP",
    'katta-buyurtma': "Оптовый заказ для строительства — NEVO GROUP",
    savat: "Корзина покупок — NEVO GROUP",
    aloqa: "Контакты и адрес склада — NEVO GROUP",
  },
  en: {
    home: "NEVO GROUP — Industrial Plumbing & Supplies from Warehouse",
    catalog: "Product Catalog — NEVO GROUP",
    tanlash: "Equipment Selection Guide — NEVO GROUP",
    'katta-buyurtma': "Wholesale & Commercial Orders — NEVO GROUP",
    savat: "Shopping Cart — NEVO GROUP",
    aloqa: "Contact Us & Warehouse Location — NEVO GROUP",
  },
};

const DESCRIPTIONS = {
  uz: "Santexnika va qurilish mollari: truba va fitinglar, zapor armatura, yong'in va elektr jihozlari. Optom va chakana narxlar, O'zbekiston bo'ylab tezkor yetkazib berish.",
  ru: "Сантехника и строительные товары: трубы и фитинги, запорная арматура, противопожарное и электрооборудование. Оптовые и розничные поставки по Узбекистану.",
  en: "Industrial plumbing and construction supplies: pipes, fittings, industrial valves, fire protection and electrical hardware. Wholesale & retail across Uzbekistan.",
};

function setMetaTag(name, content, attrName = 'name') {
  let el = document.querySelector(`meta[${attrName}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkTag(rel, href, hreflang = null) {
  let selector = `link[rel="${rel}"]`;
  if (hreflang) selector += `[hreflang="${hreflang}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Update document title, description, OpenGraph, Canonical & Hreflang
 * @param {string} route
 * @param {string} [param]
 * @param {string} [path]
 */
export function updatePageMeta(route, param = '') {
  const lang = getLang() || 'uz';
  const ready = getCatalog().status === 'ready';
  const titles = TITLES[lang] || TITLES.uz;
  
  let title = titles[route] || titles.home;
  let description = DESCRIPTIONS[lang] || DESCRIPTIONS.uz;

  if (route === 'product') {
    if (ready) {
      const product = getProductBySlug(param);
      if (product) {
        title = `${product.name} — NEVO GROUP`;
        const unit = product.unitFormatted || product.unit;
        if (lang === 'ru') {
          description = `${product.name}: ${product.priceFormatted} / ${unit}. ${product.category}. Сертифицированная продукция со склада с быстрой доставкой по Узбекистану.`;
        } else if (lang === 'en') {
          description = `${product.name}: ${product.priceFormatted} / ${unit}. ${product.category}. Certified industrial quality directly from warehouse across Uzbekistan.`;
        } else {
          description = `${product.name}: ${product.priceFormatted} / ${unit}. ${product.category}. Sertifikatlangan sifat va ombordan tezkor yetkazib berish.`;
        }
      } else {
        title = lang === 'ru' ? `Товар не найден — NEVO GROUP` : lang === 'en' ? `Product Not Found — NEVO GROUP` : `Mahsulot topilmadi — NEVO GROUP`;
      }
    } else {
      title = lang === 'ru' ? `Товар — NEVO GROUP` : lang === 'en' ? `Product — NEVO GROUP` : `Mahsulot — NEVO GROUP`;
    }
  } else if ((route === 'bolim' || route === 'catalog') && param) {
    const category = ready ? getCategoryBySlug(param) : null;
    const catName = category ? category.name : getLocalizedCategoryName(param, lang, param);
    const catDesc = category ? category.shortDesc : getLocalizedCategoryDesc(param, lang, '');
    title = `${catName} — NEVO GROUP`;
    const countStr = category && category.count ? formatProductCount(category.count, lang) : '';
    if (lang === 'ru') {
      description = `${catName}${countStr ? `: ${countStr} в наличии на складе` : ''}. ${catDesc}. Актуальные оптовые и розничные цены, технические характеристики.`;
    } else if (lang === 'en') {
      description = `${catName}${countStr ? `: ${countStr} available in stock` : ''}. ${catDesc}. Wholesale & retail prices and technical specifications.`;
    } else {
      description = `${catName}${countStr ? `: ${countStr} omborda mavjud` : ''}. ${catDesc}. To'liq narxlar va texnik xarakteristikalar.`;
    }
  }

  // Update DOM Title and Meta
  if (document.title !== title) document.title = title;
  setMetaTag('description', description);
  setMetaTag('og:title', title, 'property');
  setMetaTag('og:description', description, 'property');

  const isLive =
    String(import.meta.env?.VITE_SITE_LIVE || '').toLowerCase() === 'true' ||
    import.meta.env?.VITE_SITE_LIVE === '1';
  if (!isLive) {
    setMetaTag('robots', 'noindex,nofollow');
  } else if (route === 'product' && ready && !getProductBySlug(param)) {
    setMetaTag('robots', 'noindex');
  } else {
    setMetaTag('robots', 'index,follow');
  }

  // Compute canonical URL path
  let canonicalPath = '/';
  if (route === 'catalog' || route === 'bolim') {
    canonicalPath = param ? `/katalog/${param}` : '/katalog';
  } else if (route === 'product') {
    canonicalPath = `/katalog/mahsulot/${param}`;
  } else if (route && route !== 'home') {
    canonicalPath = `/${route}`;
  }

  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
  setLinkTag('canonical', canonicalUrl);
  setMetaTag('og:url', canonicalUrl, 'property');

  // Update Hreflang alternates
  setLinkTag('alternate', `${canonicalUrl}?lang=uz`, 'uz');
  setLinkTag('alternate', `${canonicalUrl}?lang=ru`, 'ru');
  setLinkTag('alternate', `${canonicalUrl}?lang=en`, 'en');
  setLinkTag('alternate', canonicalUrl, 'x-default');

  // Structured Data (JSON-LD)
  updateStructuredData(route, param, canonicalUrl, title, description);
}

function updateStructuredData(route, param, canonicalUrl, pageTitle, pageDesc) {
  let scriptEl = document.getElementById('nevo-dynamic-jsonld');
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'nevo-dynamic-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const catalog = getCatalog();
  const ready = catalog.status === 'ready';

  const baseBreadcrumbs = [
    { '@type': 'ListItem', position: 1, name: 'Bosh sahifa', item: SITE_ORIGIN },
  ];

  let jsonLd = null;

  if (route === 'product' && ready) {
    const product = getProductBySlug(param);
    if (product) {
      const cat = getCategoryBySlug(product.categorySlug);
      const breadcrumbs = [
        ...baseBreadcrumbs,
        { '@type': 'ListItem', position: 2, name: 'Katalog', item: `${SITE_ORIGIN}/katalog` },
      ];
      if (cat) {
        breadcrumbs.push({
          '@type': 'ListItem',
          position: 3,
          name: cat.name,
          item: `${SITE_ORIGIN}/katalog/${cat.slug}`,
        });
      }
      breadcrumbs.push({
        '@type': 'ListItem',
        position: breadcrumbs.length + 1,
        name: product.name,
        item: canonicalUrl,
      });

      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            name: product.name,
            description: pageDesc,
            image: product.image?.startsWith('http') ? product.image : `${SITE_ORIGIN}${product.image || '/og-image.jpg'}`,
            sku: product.articleCode || product.sku || `NG-${product.id}`,
            category: product.category,
            offers: {
              '@type': 'Offer',
              price: product.price || 0,
              priceCurrency: 'UZS',
              availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: canonicalUrl,
              seller: {
                '@type': 'Organization',
                name: 'NEVO GROUP',
              },
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs,
          },
        ],
      };
    }
  } else if ((route === 'catalog' || route === 'bolim') && param && ready) {
    const category = getCategoryBySlug(param);
    const catName = category ? category.name : param;
    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: pageTitle,
          description: pageDesc,
          url: canonicalUrl,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            ...baseBreadcrumbs,
            { '@type': 'ListItem', position: 2, name: 'Katalog', item: `${SITE_ORIGIN}/katalog` },
            { '@type': 'ListItem', position: 3, name: catName, item: canonicalUrl },
          ],
        },
      ],
    };
  } else if (route === 'catalog') {
    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: pageTitle,
          description: pageDesc,
          url: canonicalUrl,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            ...baseBreadcrumbs,
            { '@type': 'ListItem', position: 2, name: 'Katalog', item: canonicalUrl },
          ],
        },
      ],
    };
  } else if (route === 'aloqa') {
    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ContactPage',
          name: pageTitle,
          description: pageDesc,
          url: canonicalUrl,
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Yetkazib berish qanday amalga oshiriladi?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: "O'zbekiston bo'ylab buyurtmalar ombordan transport xizmati yoki kuryer orqali tezkor yetkazib beriladi.",
              },
            },
            {
              '@type': 'Question',
              name: 'Katta qurilish loyihalari uchun ulgurji narxlar bormi?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: "Ha, pudratchi va korxonalarga shartnoma asosida maxsus ulgurji narxlar va to'lov shartlari taqdim etiladi.",
              },
            },
          ],
        },
      ],
    };
  } else if (route && route !== 'home') {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDesc,
      url: canonicalUrl,
    };
  }

  if (jsonLd) {
    scriptEl.textContent = JSON.stringify(jsonLd);
  } else {
    scriptEl.textContent = '';
  }
}
