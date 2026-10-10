// NEVO GROUP — Ko'p tillilik tizimi (UZ / RU / EN)
// Foydalanuvchi tilni oson o'zgartirishi mumkin.

const STORAGE_KEY = 'nevo_lang';

let currentLang = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'uz' || saved === 'en') return saved;
  } catch (e) {
    void e;
  }
  return 'uz';
})();

const listeners = new Set();

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== 'uz' && lang !== 'ru' && lang !== 'en') return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    void e;
  }
  document.documentElement.lang = lang;
  listeners.forEach(fn => fn(currentLang));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const DICT = {
  uz: {
    // Header
    deliveryTop: "O'zbekiston bo'ylab yetkazib berish",
    contactUs: "Biz bilan bog'lanish",
    catalogBtn: "Katalog",
    searchPlaceholder: "Mahsulot qidirish...",
    expertConsult: "Mutaxassisdan so'rash",

    // Intro Splash
    splashSubtitle: "MUHANDISLIK VA SANTEXNIKA TIZIMLARI",
    splashSlide1: "Sanoat quvurlari va fitinglar",
    splashSlide2: "Kafolatlangan sifat va sinovlar",
    splashSlide3: "O'zbekiston bo'ylab yetkazib berish",

    // Hero
    heroBadge: "NEVO GROUP · SANTEXNIKA VA QURILISH MOLLARI",
    heroTitlePrefix: "Santexnika va qurilish mollari — ",
    heroTitleAccent: "ombordan, tez va ishonchli",
    heroDesc: "Truba va fitinglar, zapor armatura, yong'in va elektr jihozlari. Optom va chakana narxlar, O'zbekiston bo'ylab yetkazib berish.",
    heroCtaCatalog: "Katalogni ko'rish",
    heroCtaFind: "Narx so'rash",
    heroConsultBadge: "Mutaxassislarimiz yordam beradi",
    heroConsultSub: "Smeta yoki loyihangiz bo'yicha bepul maslahat",
    heroTrust1: "To'g'ridan-to'g'ri ombordan",
    heroTrust2: "Sertifikatlangan sifat",
    heroTrust3: "O'zbekiston bo'ylab yetkazish",
    heroFloat1: "Optom va chakana",
    heroFloat2: "🔧 Professional ta'minot",
    heroScrollDown: "Pastga suring",

    // Stats
    statYears: "Ombor",
    statYearsLabel: "Doimiy zaxira va tezkor yuklash",
    statProducts: "Mahsulotlar",
    statProductsLabel: "Katalogdagi tovar turlari",
    statDelivery: "Yetkazib berish",
    statDeliveryLabel: "Respublika bo'ylab to'liq qamrov",
    statPartners: "Sifat kafolati",
    statPartnersLabel: "Zavod texnik pasporti va sertifikatlar",

    // Projects / Supply Infrastructure
    projectsTag: "OMBOR VA TA'MINOT LOGISTIKASI",
    projectsTitle: "Tezkor Yetkazib Berish va Sifat Kafolati",
    projectsSub: "To'g'ridan-to'g'ri Toshkentdagi markaziy omborimizdan respublikaning barcha hududlariga ishonchli ta'minot",
    project1Title: "Markaziy Ombor Logistikasi",
    project1Type: "Tezkor jo'natish xizmati",
    project1Desc: "Omborda doimiy tayyor zaxira va buyurtmalarni o'sha kunning o'zida transportga yuklash.",
    project2Title: "Sanoat Zapor Armaturalari",
    project2Type: "Zadvijka, zatvor va filtrlar",
    project2Desc: "Suv va issiqlik magistrallari uchun bosimga chidamli sertifikatlangan cho'yan hamda po'lat armatura.",
    project3Title: "Polimer Quvurlar va Fitinglar",
    project3Type: "PPR va Polietilen mahsulotlar",
    project3Desc: "Ichki va tashqi tarmoqlar uchun to'liq komplektatsiya, tirsak, troynik va ulamalar.",
    project4Title: "Yong'in Xavfsizligi Jihozlari",
    project4Type: "Gidrantlar va shlanglar",
    project4Desc: "Sanoat va fuqarolik inshootlari uchun sertifikatlangan yong'in o'chirish uskunalari.",
    project5Title: "Qurilish Obyektlari Ta'minoti",
    project5Type: "Optom va chakana ta'minot",
    project5Desc: "Smeta bo'yicha to'liq komplektatsiya va muddatida yetkazib berish shartnomasi.",
    project6Title: "Texnik Maslahat va Yordam",
    project6Type: "Muhandislik ko'magi",
    project6Desc: "Loyiha talablariga mos armatura va quvur o'lchamlarini tanlashda professional yordam.",

    // Sections
    workersTag: "MUTAXASSISLAR VA ISH JARAYONI",
    workersTitle: "Bizning Jamoa va Amaliyotdagi Sifat",
    workersSub: "Obyektlarda montaj, ombor nazorati va muhandislik xizmatlari",
    workersContactBtn: "Mutaxassislar bilan bog'lanish",

    videoTag: "VIDEO SHARHLAR",
    videoTitle: "Mahsulotlarimiz Ish Jarayonida",
    videoSub: "Haqiqiy montaj, payvandlash va ombor operatsiyalari",

    catsTitle: "Mashhur bo'limlar",
    catsSub: "Asosiy yo'nalishlar bo'yicha mahsulotlar",

    featuredTitle: "Tanlangan mahsulotlar",
    featuredSub: "Ko'p so'raladigan va eng sifatli pozitsiyalar",
    viewAll: "Hammasi",

    budgetTitle: "Arzon narxlar",
    budgetSub: "Kichik diametrdagi ommabop fitinglar",

    whyUsTitle: "Nega NEVO GROUP?",
    whyUsSub: "Biz bilan ishlashning asosiy afzalliklari",

    // CTA
    teaserTitle: "Qurilish uchun mahsulot qidiryapsizmi?",
    teaserDesc: "Tovar nomi, tavsif va sonini yozing — katalogdan mos tovarlarni ajratib, 3 xil eng yaxshi taklif beramiz.",
    teaserBtn: "3 xil taklif olish",

    ctaLightTitle: "Uy uchunmi yoki qurilish uchunmi?",
    ctaLightDesc: "Kerakli mahsulotni topishda professional mutaxassislarimiz yordam beradi.",
    ctaLightBtn1: "Mahsulotlarni ko'rish",
    ctaLightBtn2: "Mutaxassis bilan bog'lanish",

    ctaDarkTitle: "Kerakli mahsulotni topdingizmi?",
    ctaDarkDesc: "Narx va mavjudligini bilish uchun biz bilan hoziroq bog'laning.",
    ctaDarkBtn: "Bog'lanish",

    // Catalog & Products
    catalogTitle: "Mahsulotlar va Katalog",
    catalogSub: "Isitish, suv ta'minoti va muhandislik tizimlari uchun sanoat jihozlari, komplektovchi qismlar va materiallarning keng assortimenti.",
    catalogSearchLabel: "KATALOGDAN QIDIRISH",
    catalogSearchPlaceholder: "Mahsulot qidirish — masalan: PN20, fiting, kran...",
    slidePipes: "Kompozit & PP-R Quvurlar",
    slideValves: "Zapor Armatura & Zadvijkalar",
    slideSewer: "Kanalizatsiya Tizimlari",
    allProducts: "Barchasi",
    inStock: "Omborda",
    outOfStock: "Mavjud emas",
    badge3D: "3D",
    skuLabel: "Kodi",
    addToCart: "Savatga",
    addedToCart: "Qo'shildi!",
    filterBtn: "Filtrlar",
    sortBy: "Saralash",
    sortDefault: "Odatiy saralash",
    sortPriceAsc: "Avval arzonlari",
    sortPriceDesc: "Avval qimmatlari",
    sortName: "Nomi bo'yicha (A-Z)",
    showMore: "Ko'proq ko'rsatish",
    viewCatalogBtn: "Katalogni ko'rish",
    viewPhoto: "Rasmni ko'rish",
    view3D: "3D modelni ko'rish",
    openCategory: "Ochish",
    backToCatalog: "Katalogga qaytish",
    downloadCatalogs: "Kataloglarni ko'rish va yuklab olish",
    pdfCatalog: "PDF Katalog",
    viewPdf: "Ko'rish",
    downloadPdf: "Yuklab olish",
    productDimensions: "O'lchamlar va Parametrlar",
    diameterCol: "Diametr / O'lchami",
    packQtyCol: "O'ramda",
    unitCol: "Birligi",
    brandCol: "Brend",
    skuCol: "Kodi",
    orderNow: "Buyurtma berish",
    requestPrice: "Narx so'rash",
    relatedProducts: "O'xshash mahsulotlar",
    specNote: "Ulgurji narxlar va qulay shartlar bo'yicha mutaxassisimiz bilan bog'laning.",
    rotate3DHint: "Aylantirish uchun sichqoncha yoki barmog'ingiz bilan suring",
    zoomIn: "Kattalashtirish",
    zoomOut: "Kichraytirish",
    resetView: "Tiklash",
    recentSearches: "So'nggi qidiruvlar",
    noSearchResults: "Mahsulot topilmadi",
    escToClose: "Yopish uchun ESC",
    productsWord: "ta mahsulot",
    breadHome: "Bosh sahifa",
    breadCatalog: "Katalog",
  },

  ru: {
    // Header
    deliveryTop: "Доставка по всему Узбекистану",
    contactUs: "Связаться с нами",
    catalogBtn: "Каталог",
    searchPlaceholder: "Поиск товаров...",
    expertConsult: "Консультация эксперта",

    // Intro Splash
    splashSubtitle: "ИНЖЕНЕРНЫЕ И САНТЕХНИЧЕСКИЕ СИСТЕМЫ",
    splashSlide1: "Промышленные трубы и фитинги",
    splashSlide2: "Гарантированное качество и испытания",
    splashSlide3: "Быстрая доставка по всему Узбекистану",

    // Hero
    heroBadge: "NEVO GROUP · САНТЕХНИКА И СТРОИТЕЛЬНЫЕ МАТЕРИАЛЫ",
    heroTitlePrefix: "Сантехника и строительные товары — ",
    heroTitleAccent: "со склада, быстро и надежно",
    heroDesc: "Трубы и фитинги, запорная арматура, противопожарное и электрооборудование. Оптовые и розничные цены, доставка по всему Узбекистану.",
    heroCtaCatalog: "Смотреть каталог",
    heroCtaFind: "Запросить цены",
    heroConsultBadge: "Наши специалисты помогут",
    heroConsultSub: "Бесплатная консультация по вашему проекту или смете",
    heroTrust1: "Прямые поставки со склада",
    heroTrust2: "Сертифицированное качество",
    heroTrust3: "Доставка по Узбекистану",
    heroFloat1: "Опт и розница",
    heroFloat2: "🔧 Профессиональные поставки",
    heroScrollDown: "Листайте вниз",

    // Stats
    statYears: "Склад",
    statYearsLabel: "Постоянный запас и оперативная отгрузка",
    statProducts: "Товаров",
    statProductsLabel: "Наименований продукции в каталоге",
    statDelivery: "Доставка",
    statDeliveryLabel: "Полный охват всех регионов республики",
    statPartners: "Гарантия",
    statPartnersLabel: "Заводские технические паспорта и сертификаты",

    // Projects / Supply Infrastructure
    projectsTag: "СКЛАД И ЛОГИСТИКА",
    projectsTitle: "Оперативная поставка и гарантия качества",
    projectsSub: "Прямые поставки с центрального склада в Ташкенте во все регионы республики",
    project1Title: "Логистика центрального склада",
    project1Type: "Оперативная отгрузка",
    project1Desc: "Постоянный складской запас и отгрузка заказов в день оформления.",
    project2Title: "Промышленная запорная арматура",
    project2Type: "Задвижки, затворы и фильтры",
    project2Desc: "Сертифицированная чугунная и стальная арматура для водо- и теплоснабжения.",
    project3Title: "Полимерные трубы и фитинги",
    project3Type: "Трубы PPR и ПНД",
    project3Desc: "Полная комплектация для внутренних и наружных инженерных систем.",
    project4Title: "Противопожарное оборудование",
    project4Type: "Гидранты и рукава",
    project4Desc: "Сертифицированные средства пожарной безопасности для объектов любого масштаба.",
    project5Title: "Комплектация строительных объектов",
    project5Type: "Опт и розница",
    project5Desc: "Поставка полного перечня инженерных материалов точно по смете.",
    project6Title: "Техническая консультация",
    project6Type: "Поддержка специалистов",
    project6Desc: "Помощь в подборе диаметров, давления и материалов под требования проекта.",

    // Sections
    workersTag: "СПЕЦИАЛИСТЫ И РАБОЧИЙ ПРОЦЕСС",
    workersTitle: "Наша Команда и Качество на Практике",
    workersSub: "Монтаж на объектах, складской контроль и инженерные услуги",
    workersContactBtn: "Связаться со специалистами",

    videoTag: "ВИДЕООБЗОРЫ",
    videoTitle: "Наша Продукция в Работе",
    videoSub: "Реальный монтаж, сварка и складские операции",

    catsTitle: "Популярные категории",
    catsSub: "Продукция по ключевым направлениям",

    featuredTitle: "Рекомендуемые товары",
    featuredSub: "Наиболее востребованные и надежные позиции",
    viewAll: "Смотреть все",

    budgetTitle: "Доступные цены",
    budgetSub: "Популярные фитинги малых диаметров",

    whyUsTitle: "Почему NEVO GROUP?",
    whyUsSub: "Ключевые преимущества работы с нами",

    // CTA
    teaserTitle: "Ищете материалы для строительства?",
    teaserDesc: "Укажите наименование и количество — подберем из каталога 3 оптимальных варианта под ваш бюджет.",
    teaserBtn: "Получить 3 варианта",

    ctaLightTitle: "Для дома или крупной стройки?",
    ctaLightDesc: "Наши профессиональные инженеры помогут подобрать точные спецификации.",
    ctaLightBtn1: "Смотреть каталог",
    ctaLightBtn2: "Консультация специалиста",

    ctaDarkTitle: "Нашли нужную продукцию?",
    ctaDarkDesc: "Свяжитесь с нами прямо сейчас, чтобы уточнить актуальное наличие и оптовые цены.",
    ctaDarkBtn: "Связаться",

    // Catalog & Products
    catalogTitle: "Продукция и Каталог",
    catalogSub: "Широкий ассортимент промышленного оборудования, комплектующих и материалов для систем отопления, водоснабжения и инженерии.",
    catalogSearchLabel: "ПОИСК ПО КАТАЛОГУ",
    catalogSearchPlaceholder: "Поиск продукции — например: PN20, фитинг, кран...",
    slidePipes: "Композитные & PP-R Трубы",
    slideValves: "Запорная арматура & Задвижки",
    slideSewer: "Канализационные Системы",
    allProducts: "Все",
    inStock: "В наличии",
    outOfStock: "Нет в наличии",
    badge3D: "3D",
    skuLabel: "Артикул",
    addToCart: "В корзину",
    addedToCart: "Добавлено!",
    filterBtn: "Фильтры",
    sortBy: "Сортировка",
    sortDefault: "По умолчанию",
    sortPriceAsc: "Сначала дешевые",
    sortPriceDesc: "Сначала дорогие",
    sortName: "По названию (А-Я)",
    showMore: "Показать больше",
    viewCatalogBtn: "Смотреть каталог",
    viewPhoto: "Смотреть фото",
    view3D: "Смотреть 3D модель",
    openCategory: "Открыть",
    backToCatalog: "Вернуться в каталог",
    downloadCatalogs: "Просмотр и скачивание каталогов",
    pdfCatalog: "PDF Каталог",
    viewPdf: "Смотреть",
    downloadPdf: "Скачать",
    productDimensions: "Размеры и параметры",
    diameterCol: "Диаметр / Размер",
    packQtyCol: "В упаковке",
    unitCol: "Ед. изм.",
    brandCol: "Бренд",
    skuCol: "Артикул",
    orderNow: "Заказать",
    requestPrice: "Запросить цену",
    relatedProducts: "Похожие товары",
    specNote: "За оптовыми ценами и условиями поставки обращайтесь к нашим специалистам.",
    rotate3DHint: "Перетаскивайте мышью или пальцем для вращения 3D-модели",
    zoomIn: "Увеличить",
    zoomOut: "Уменьшить",
    resetView: "Сбросить",
    recentSearches: "Недавние поиски",
    noSearchResults: "Ничего не найдено",
    escToClose: "Нажмите ESC чтобы закрыть",
    productsWord: "товаров",
    breadHome: "Главная",
    breadCatalog: "Каталог",
  },
  en: {
    // Header
    deliveryTop: "Delivery throughout Uzbekistan",
    contactUs: "Contact Us",
    catalogBtn: "Catalog",
    searchPlaceholder: "Search products...",
    expertConsult: "Ask an Expert",

    // Intro Splash
    splashSubtitle: "ENGINEERING & PIPING SYSTEMS",
    splashSlide1: "Industrial pipes and fittings",
    splashSlide2: "Guaranteed quality and certified testing",
    splashSlide3: "Delivery across Uzbekistan",

    // Hero
    heroBadge: "NEVO GROUP · PLUMBING & INDUSTRIAL SUPPLIES",
    heroTitlePrefix: "Plumbing and Construction Supplies — ",
    heroTitleAccent: "Direct from Warehouse, Fast & Reliable",
    heroDesc: "Pipes and fittings, industrial valves, fire safety, and electrical equipment. Wholesale and retail pricing with delivery across Uzbekistan.",
    heroCtaCatalog: "View Catalog",
    heroCtaFind: "Request Pricing",
    heroConsultBadge: "Our specialists are ready to help",
    heroConsultSub: "Free consultation based on your bill of materials or project",
    heroTrust1: "Direct warehouse supply",
    heroTrust2: "Certified quality standards",
    heroTrust3: "Republic-wide delivery",
    heroFloat1: "Wholesale & retail",
    heroFloat2: "🔧 Professional supply",
    heroScrollDown: "Scroll down",

    // Stats
    statYears: "Warehouse",
    statYearsLabel: "Ready stock and same-day dispatch",
    statProducts: "Products",
    statProductsLabel: "Items in catalog assortment",
    statDelivery: "Delivery",
    statDeliveryLabel: "Full coverage across all regions",
    statPartners: "Guarantee",
    statPartnersLabel: "Factory certificates and technical passports",

    // Projects / Supply Infrastructure
    projectsTag: "WAREHOUSE & LOGISTICS",
    projectsTitle: "Fast Supply and Certified Quality",
    projectsSub: "Direct warehouse supply from Tashkent across all regions of Uzbekistan",
    project1Title: "Central Warehouse Logistics",
    project1Type: "Prompt dispatch",
    project1Desc: "Comprehensive stock ready for immediate shipment on the day of order.",
    project2Title: "Industrial Valves & Controls",
    project2Type: "Gate valves, strainers, butterflies",
    project2Desc: "Pressure-tested cast iron and steel valves for water and heating mains.",
    project3Title: "Polymer Piping & Fittings",
    project3Type: "PPR and HDPE pipelines",
    project3Desc: "Complete fitting assemblies for internal and external utility distribution.",
    project4Title: "Fire Protection Equipment",
    project4Type: "Hydrants and hoses",
    project4Desc: "Certified fire prevention hardware for industrial and residential facilities.",
    project5Title: "Construction Project Supply",
    project5Type: "Wholesale and retail",
    project5Desc: "Accurate bill-of-materials fulfillment delivered strictly on schedule.",
    project6Title: "Technical Consultation",
    project6Type: "Engineering assistance",
    project6Desc: "Expert sizing and specification support tailored to project requirements.",

    // Sections
    workersTag: "SPECIALISTS & FIELD QUALITY",
    workersTitle: "Our Team & Field Excellence",
    workersSub: "On-site installation, warehouse quality control, and engineering services",
    workersContactBtn: "Talk to Specialists",

    videoTag: "VIDEO OVERVIEWS",
    videoTitle: "Our Products in Real Operations",
    videoSub: "Visual inspection, pressure testing, and warehouse stock quality control",

    catsTitle: "Popular Categories",
    catsSub: "Products by core engineering lines",

    featuredTitle: "Featured Products",
    featuredSub: "High-demand, certified components",
    viewAll: "View All",

    budgetTitle: "Affordable Essentials",
    budgetSub: "Popular small-diameter fittings",

    whyUsTitle: "Why NEVO GROUP?",
    whyUsSub: "Key advantages of working with us",

    // CTA
    teaserTitle: "Need construction supplies?",
    teaserDesc: "Send your product list and quantities — we'll assemble 3 cost-effective options from our catalog.",
    teaserBtn: "Get 3 Options",

    ctaLightTitle: "For home or industrial project?",
    ctaLightDesc: "Our qualified engineers will help you choose the exact pressure classes and wall thicknesses.",
    ctaLightBtn1: "Browse Catalog",
    ctaLightBtn2: "Consult an Engineer",

    ctaDarkTitle: "Found what you need?",
    ctaDarkDesc: "Get in touch right now to check immediate stock and wholesale terms.",
    ctaDarkBtn: "Contact Now",

    // Catalog & Products
    catalogTitle: "Products & Catalog",
    catalogSub: "Comprehensive assortment of industrial equipment, components, and certified piping materials for heating, water supply, and building utilities.",
    catalogSearchLabel: "SEARCH CATALOG",
    catalogSearchPlaceholder: "Search products — e.g. PN20, fitting, valve...",
    slidePipes: "Composite & PP-R Pipes",
    slideValves: "Valves & Industrial Fittings",
    slideSewer: "Drainage & Sewer Systems",
    allProducts: "All Products",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    badge3D: "3D",
    skuLabel: "SKU",
    addToCart: "Add to Cart",
    addedToCart: "Added!",
    filterBtn: "Filters",
    sortBy: "Sort by",
    sortDefault: "Default sorting",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    sortName: "Alphabetical (A-Z)",
    showMore: "Show more",
    viewCatalogBtn: "Browse Catalog",
    viewPhoto: "View Photo",
    view3D: "View 3D Model",
    openCategory: "Open",
    backToCatalog: "Back to Catalog",
    downloadCatalogs: "Browse & Download Catalogs",
    pdfCatalog: "PDF Catalog",
    viewPdf: "View",
    downloadPdf: "Download",
    productDimensions: "Dimensions & Specifications",
    diameterCol: "Diameter / Size",
    packQtyCol: "In Package",
    unitCol: "Unit",
    brandCol: "Brand",
    skuCol: "Article / SKU",
    orderNow: "Order Now",
    requestPrice: "Request Price",
    relatedProducts: "Related Products",
    specNote: "Contact our engineering specialists for wholesale prices and delivery schedules.",
    rotate3DHint: "Drag with mouse or swipe finger to rotate 3D model",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetView: "Reset",
    recentSearches: "Recent Searches",
    noSearchResults: "No products found",
    escToClose: "Press ESC to close",
    productsWord: "products",
    breadHome: "Home",
    breadCatalog: "Catalog",
  }
};

export function t(key) {
  const lang = getLang();
  return (DICT[lang] && DICT[lang][key]) || (DICT.uz && DICT.uz[key]) || key;
}
