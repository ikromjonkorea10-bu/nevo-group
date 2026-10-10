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
    heroBadge: "NEVO GROUP · SANOAT VA MUHANDISLIK TIZIMLARI",
    heroTitlePrefix: "Zamonaviy muhandislik va ",
    heroTitleAccent: "santexnika tizimlari",
    heroDesc: "O'zbekiston bo'ylab yirik obyektlar, sanoat korxonalari va xonadonlar uchun quvurlar, fitinglar hamda zapor armaturalar to'g'ridan-to'g'ri birinchi qo'ldan.",
    heroCtaCatalog: "Mahsulotlar katalogi",
    heroCtaFind: "Loyiha bo'yicha maslahat",
    heroConsultBadge: "Mutaxassislarimiz yordam beradi",
    heroConsultSub: "Loyiha yoki smetangiz bo'yicha bepul maslahat",
    heroTrust1: "Narxlar praysdan, ochiq",
    heroTrust2: "Kodi va o'lchami bilan",
    heroTrust3: "O'zbekiston bo'ylab yetkazish",
    heroFloat1: "Narxlar praysdan",
    heroFloat2: "🔧 Mutaxassislar tanlovi",
    heroScrollDown: "Pastga suring",

    // Stats
    statYears: "Yil",
    statYearsLabel: "O'zbekiston bozorida tajriba",
    statProducts: "Mahsulotlar",
    statProductsLabel: "Katalogdagi tovar nomenklaturasi",
    statDelivery: "Yetkazib berish",
    statDeliveryLabel: "Respublika bo'ylab to'liq qamrov",
    statPartners: "Hamkorlar",
    statPartnersLabel: "Ishonchli montajchi va quruvchilar",

    // Projects
    projectsTag: "AMALIY TAJRIBA VA ISHONCH",
    projectsTitle: "O'zbekistonning Yirik Loyihalarida",
    projectsSub: "Nufuzli obyektlar, osmono'par binolar va sanoat majmualarida NEVO GROUP mahsulotlari qo'llanilgan",
    project1Title: "Nest One (Tashkent City)",
    project1Type: "266.5m Osmono'par Majmua",
    project1Desc: "Yuqori bosimli quvur magistrallari, po'lat zadvijkalar va tebranishga chidamli fitinglar.",
    project2Title: "Humo Arena Muz Saroyi",
    project2Type: "12,500 o'rinli ko'p tarmoqli arena",
    project2Desc: "Sovutish va suv ta'minoti tarmog'i uchun maxsus chidamli zapor klapanlar hamda flaneslar.",
    project3Title: "Islom Sivilizatsiyasi Markazi",
    project3Type: "Mahobatli me'moriy majmua",
    project3Desc: "Yong'in xavfsizligi va isitish tizimlari, gidrantlar hamda maxsus quyma armaturalar.",
    project4Title: "Tashkent City Congress Hall",
    project4Type: "Xalqaro biznes va kongress markazi",
    project4Desc: "Sanoat ventilyatsiyasi, suv uzatish liniyalari va sertifikatlangan montaj detallari.",
    project5Title: "Yangi O'zbekiston Massivlari",
    project5Type: "Turar-joy va ijtimoiy obyektlar",
    project5Desc: "Ichki va tashqi muhandislik tarmoqlari, PE bosimli quvurlar va suv hisoblagich uzellari.",
    project6Title: "Magistral Muhandislik Tarmoqlari",
    project6Type: "Sanoat va shahar kommunikatsiyalari",
    project6Desc: "Katta diametrli magistral quvurlar, germetik fitinglar va demontaj vstavkalari.",

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
    heroBadge: "NEVO GROUP · ПРОМЫШЛЕННЫЕ И ИНЖЕНЕРНЫЕ СИСТЕМЫ",
    heroTitlePrefix: "Комплексные инженерные и ",
    heroTitleAccent: "сантехнические решения",
    heroDesc: "Трубы, фитинги, запорная арматура и оборудование для крупных объектов, производств и частного сектора напрямую со склада в Ташкенте.",
    heroCtaCatalog: "Каталог продукции",
    heroCtaFind: "Консультация по проекту",
    heroConsultBadge: "Наши специалисты помогут",
    heroConsultSub: "Бесплатная консультация по вашему проекту или смете",
    heroTrust1: "Прозрачные цены по прайсу",
    heroTrust2: "С артикулами и размерами",
    heroTrust3: "Доставка по Узбекистану",
    heroFloat1: "Цены из прайса",
    heroFloat2: "🔧 Выбор специалистов",
    heroScrollDown: "Листайте вниз",

    // Stats
    statYears: "Лет",
    statYearsLabel: "Успешного опыта на рынке Узбекистана",
    statProducts: "Товаров",
    statProductsLabel: "Наименований продукции на складе",
    statDelivery: "Доставка",
    statDeliveryLabel: "Полный охват всех регионов республики",
    statPartners: "Партнеров",
    statPartnersLabel: "Надежных монтажников и строительных компаний",

    // Projects
    projectsTag: "ПРАКТИЧЕСКИЙ ОПЫТ И ДОВЕРИЕ",
    projectsTitle: "На крупных проектах Узбекистана",
    projectsSub: "Продукция NEVO GROUP успешно применена на престижных высотных зданиях и промышленных комплексах",
    project1Title: "Nest One (Tashkent City)",
    project1Type: "Небоскреб 266.5 м",
    project1Desc: "Высоконапорные магистральные трубы, стальные задвижки и вибростойкие фитинги.",
    project2Title: "Humo Arena (Ледовый дворец)",
    project2Type: "Многофункциональная арена на 12 500 мест",
    project2Desc: "Специальная запорная арматура и фланцы для систем хладоснабжения и водоотведения.",
    project3Title: "Центр Исламской Цивилизации",
    project3Type: "Грандиозный архитектурный ансамбль",
    project3Desc: "Системы пожаротушения, отопления, гидранты и чугунная запорная арматура.",
    project4Title: "Tashkent City Congress Hall",
    project4Type: "Международный конгресс-холл и бизнес-центр",
    project4Desc: "Промышленная вентиляция, магистрали водоснабжения и сертифицированные монтажные узлы.",
    project5Title: "Жилые массивы Янги Узбекистон",
    project5Type: "Жилые комплексы и социальные объекты",
    project5Desc: "Внутренние и наружные инженерные сети, напорные ПЭ трубы и узлы учета воды.",
    project6Title: "Магистральные Инженерные Сети",
    project6Type: "Промышленные и городские коммуникации",
    project6Desc: "Трубы больших диаметров, герметичные фитинги и демонтажные компенсационные вставки.",

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
    heroBadge: "NEVO GROUP · INDUSTRIAL & ENGINEERING SYSTEMS",
    heroTitlePrefix: "Advanced Engineering & ",
    heroTitleAccent: "Piping Solutions",
    heroDesc: "Certified pipes, fittings, and industrial valves directly from the first-hand supplier for major construction projects, factories, and residential networks across Uzbekistan.",
    heroCtaCatalog: "View Catalog",
    heroCtaFind: "Project Consultation",
    heroConsultBadge: "Our engineers are here to assist",
    heroConsultSub: "Free consultation based on your project drawings or BOQ",
    heroTrust1: "Direct transparent prices",
    heroTrust2: "Verified codes & dimensions",
    heroTrust3: "Republic-wide delivery",
    heroFloat1: "Official Price List",
    heroFloat2: "🔧 Professional Choice",
    heroScrollDown: "Scroll down",

    // Stats
    statYears: "Years",
    statYearsLabel: "Industry experience in Uzbekistan",
    statProducts: "Products",
    statProductsLabel: "Items in catalog assortment",
    statDelivery: "Delivery",
    statDeliveryLabel: "100% full republic coverage",
    statPartners: "Partners",
    statPartnersLabel: "Trusted installers and construction firms",

    // Projects
    projectsTag: "PROVEN TRACK RECORD & TRUST",
    projectsTitle: "Major Projects in Uzbekistan",
    projectsSub: "Prestigious landmarks, skyscrapers, and industrial complexes built with NEVO GROUP products",
    project1Title: "Nest One (Tashkent City)",
    project1Type: "266.5m High-Rise Complex",
    project1Desc: "High-pressure piping mains, heavy steel gate valves, and vibration-proof fittings.",
    project2Title: "Humo Arena Ice Dome",
    project2Type: "12,500-Seat Multi-purpose Arena",
    project2Desc: "Special resilient shut-off valves and flanges for refrigeration and central water networks.",
    project3Title: "Center of Islamic Civilization",
    project3Type: "Grand Monumental Complex",
    project3Desc: "Fire-suppression infrastructure, specialized hydrants, and heavy cast fittings.",
    project4Title: "Tashkent City Congress Hall",
    project4Type: "International Business & Convention Center",
    project4Desc: "Industrial HVAC piping, high-capacity water delivery, and certified assembly joints.",
    project5Title: "Yangi Ozbekiston Residential Hubs",
    project5Type: "Modern Residential & Social Centers",
    project5Desc: "Internal and external municipal utilities, PE pressure pipes, and water metering stations.",
    project6Title: "Main Trunk Utility Pipelines",
    project6Type: "Urban & Industrial Arteries",
    project6Desc: "Large diameter transmission pipelines, hermetic fittings, and dismantling joints.",

    // Sections
    workersTag: "SPECIALISTS & FIELD QUALITY",
    workersTitle: "Our Team & Field Excellence",
    workersSub: "On-site installation, warehouse quality control, and engineering services",
    workersContactBtn: "Talk to Specialists",

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
