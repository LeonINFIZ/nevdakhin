import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Category, Product, Order, StoreSettings } from '@/types';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'nevdakhin.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance & concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    composition TEXT,
    weight TEXT,
    storage TEXT,
    price REAL NOT NULL,
    old_price REAL,
    images TEXT DEFAULT '[]', -- JSON array of image URLs
    in_stock INTEGER DEFAULT 1,
    badge TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY(subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_comment TEXT,
    delivery_type TEXT NOT NULL, -- 'pickup' | 'delivery'
    delivery_address TEXT,
    delivery_lat REAL,
    delivery_lon REAL,
    delivery_distance_km REAL,
    delivery_cost REAL DEFAULT 0,
    subtotal REAL NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash_on_delivery',
    payment_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    weight TEXT,
    quantity INTEGER NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS geocache (
    address_query TEXT PRIMARY KEY,
    result_address TEXT,
    geo_lat REAL,
    geo_lon REAL,
    distance_km REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    bg_color TEXT NOT NULL DEFAULT '#FFF4E5',
    text_color TEXT NOT NULL DEFAULT '#B25E09',
    border_color TEXT NOT NULL DEFAULT '#FCD34D',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image TEXT NOT NULL,
    video_url TEXT,
    prep_time TEXT DEFAULT '45 мин',
    portions TEXT DEFAULT '4 порции',
    difficulty TEXT DEFAULT 'Средне',
    ingredients TEXT DEFAULT '[]',
    steps TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
  );
`);

// Seed default settings if not exists
const defaultSettings: Record<string, string> = {
  base_lat: '56.131897',
  base_lon: '43.743571',
  base_address: 'Нижегородская область, Богородский м.о., д. Бурцево, ул. Раздолье, 236/2',
  delivery_radius_km: '4.0',
  delivery_price: '250',
  free_delivery_threshold: '5000',
  producer_name: 'ИП Невдахин Дмитрий Викторович',
  producer_inn: '526098175957',
  producer_ogrnip: '317527500056271',
  producer_phone: '+7 (920) 000-00-00',
};

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(defaultSettings)) {
  insertSetting.run(k, v);
}

// Seed categories and initial products if database is empty
const categoriesCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }).count;
if (categoriesCount === 0) {
  const seedCategories = [
    {
      name: 'Консервы и тушенка',
      slug: 'konservy-tushenka',
      description: 'Домашняя томленая тушенка в автоклаве из отборного фермерского мяса',
      subcategories: ['Тушенка', 'Паштеты', 'Мясные каши'],
    },
    {
      name: 'Заготовки, соусы и соления',
      slug: 'zagotovki-sousy-soleniya',
      description: 'Домашние соления, хрустящие огурчики и авторские соусы к мясу',
      subcategories: ['Соусы', 'Соления', 'Заготовки'],
    },
    {
      name: 'Копченые деликатесы',
      slug: 'kopchenye-delikatesy',
      description: 'Натуральное горячее копчение на ольховой щепе без жидкого дыма и консервантов',
      subcategories: ['Грудинка', 'Ребра', 'Птица', 'Рулеты'],
    },
    {
      name: 'Колбасные изделия',
      slug: 'kolbasnye-izdeliya',
      description: 'Крафтовая колбаса по семейным и ГОСТ рецептурам из 100% натурального мяса',
      subcategories: ['Краковская', 'Сервелат', 'Сосиски', 'Докторская', 'Ветчина'],
    },
    {
      name: 'Заморозка и полуфабрикаты',
      slug: 'zamorozka-polufabrikaty',
      description: 'Ручная лепка, тонкое тесто и много сочной начинки из рубленого мяса',
      subcategories: ['Пельмени', 'Хинкали', 'Голубцы'],
    },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const insertSubcategory = db.prepare(`
    INSERT INTO subcategories (category_id, name, slug, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (
      category_id, subcategory_id, title, slug, description, composition, weight, storage, price, old_price, images, in_stock, badge, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialProducts = [
    // Консервы
    {
      catSlug: 'konservy-tushenka',
      subSlug: 'Тушенка',
      title: 'Тушенка свиная домашняя ГОСТ',
      slug: 'tushenka-svinaya-gost',
      description: 'Крупнокусковая свинина, приготовленная в автоклаве по традиционной технологии. Мягкое сочное мясо в собственном желе с прозрачным жирком.',
      composition: 'Свинина фермерская (окорок, лопатка), лавровый лист, перец черный горошек, соль поваренная.',
      weight: '500 г (стекло)',
      storage: '24 месяца при температуре от 0°C до +20°C',
      price: 390,
      old_price: 430,
      badge: 'Хит продаж',
      images: ['/images/products/tushenka.jpg'],
    },
    {
      catSlug: 'konservy-tushenka',
      subSlug: 'Тушенка',
      title: 'Тушенка говяжья высший сорт',
      slug: 'tushenka-govyazhya-vysshiy-sort',
      description: 'Отборная говядина длительного томления. Нежнейшие волокна мяса, насыщенный мясной сок и натуральные специи.',
      composition: 'Говядина высшей категории, лук репчатый, соль пищевая, перец черный молотый, лавровый лист.',
      weight: '500 г (стекло)',
      storage: '24 месяца при температуре от 0°C до +20°C',
      price: 460,
      old_price: null,
      badge: 'Семейный рецепт',
      images: ['/images/products/tushenka.jpg'],
    },
    {
      catSlug: 'konservy-tushenka',
      subSlug: 'Паштеты',
      title: 'Паштет печеночный сливочный',
      slug: 'pashtet-pechenochnyy-slivochnyy',
      description: 'Нежный воздушный паштет из фермерской печени со сливочным маслом и пассерованными овощами.',
      composition: 'Печень говяжья, печень свиная, масло сливочное 82.5%, морковь, лук репчатый, мускатный орех, соль, перец.',
      weight: '350 г (стекло)',
      storage: '12 месяцев при температуре от 0°C до +15°C',
      price: 310,
      old_price: null,
      badge: 'Новинка',
      images: ['/images/products/pashtet.jpg'],
    },

    // Соления и заготовки
    {
      catSlug: 'zagotovki-sousy-soleniya',
      subSlug: 'Соления',
      title: 'Огурчики хрустящие бочкового посола',
      slug: 'ogurchiki-khrustyashchie-bochkovye',
      description: 'Огурчики с собственного огорода, засоленные по старинному рецепту с хреном, чесноком, листьями смородины и дуба.',
      composition: 'Огурцы свежие грунтовые, чеснок, лист дуба, лист смородины, зонтики укропа, корень хрена, соль крупная.',
      weight: '950 г (банка 1л)',
      storage: '12 месяцев при температуре от +2°C до +8°C',
      price: 340,
      old_price: null,
      badge: 'Семейный рецепт',
      images: ['/images/products/soleniya.jpg'],
    },
    {
      catSlug: 'zagotovki-sousy-soleniya',
      subSlug: 'Соусы',
      title: 'Соус томатный домашний с травами к шашлыку',
      slug: 'sous-tomatnyy-domashniy-k-shashlyku',
      description: 'Густой ароматный соус из спелых протертых помидоров, чеснока, кинзы и кавказских пряностей.',
      composition: 'Томаты грунтовые протертые, паприка, чеснок свежий, кинза, базилик, яблочный уксус, сахар, соль.',
      weight: '400 г (стекло)',
      storage: '12 месяцев при температуре от 0°C до +18°C',
      price: 260,
      old_price: null,
      badge: null,
      images: ['/images/products/sous.jpg'],
    },

    // Копчености
    {
      catSlug: 'kopchenye-delikatesy',
      subSlug: 'Грудинка',
      title: 'Грудинка на ольховой щепе горячего копчения',
      slug: 'grudinka-na-olkhovoy-shchepe',
      description: 'Фирменная грудинка с идеальным чередованием мясных и сальных прослоек. Мягкая, тает во рту, с благородным ароматом натурального ольхового дыма.',
      composition: 'Грудинка свиная фермерская, чеснок свежий, перец черный свежемолотый, кориандр, соль поваренная.',
      weight: '~ 450-550 г (вакуумная упаковка)',
      storage: '30 суток при температуре от 0°C до +6°C',
      price: 520,
      old_price: 580,
      badge: 'Хит продаж',
      images: ['/images/products/grudinka.jpg'],
    },
    {
      catSlug: 'kopchenye-delikatesy',
      subSlug: 'Ребра',
      title: 'Ребрышки свиные копченые к пенному',
      slug: 'rebryshki-svinye-kopchenye',
      description: 'Мясные свиные ребра в сухом пряном маринаде, закопченные на яблоневой и ольховой щепе.',
      composition: 'Ребра свиные мясные, паприка копченая, сушеный чеснок, перец душистый, соль.',
      weight: '~ 600-700 г (вакуум)',
      storage: '25 суток при температуре от 0°C до +6°C',
      price: 490,
      old_price: null,
      badge: 'Рекомендуем',
      images: ['/images/products/rebryshki.jpg'],
    },
    {
      catSlug: 'kopchenye-delikatesy',
      subSlug: 'Птица',
      title: 'Цыпленок фермерский ольхового копчения',
      slug: 'tsiplenok-fermerskiy-olkhovogo-kopcheniya',
      description: 'Нежное, сочное мясо цыпленка с золотистой тонкой корочкой и тонким ароматом костра.',
      composition: 'Цыпленок бройлерный фермерский, розмарин, чеснок, смесь перцев, соль.',
      weight: '~ 1.1-1.3 кг (целиком)',
      storage: '20 суток при температуре от +2°C до +6°C',
      price: 640,
      old_price: null,
      badge: null,
      images: ['/images/products/chicken.jpg'],
    },

    // Колбасные изделия
    {
      catSlug: 'kolbasnye-izdeliya',
      subSlug: 'Краковская',
      title: 'Колбаса Краковская ремесленная',
      slug: 'kolbasa-krakovskaya-remeslennaya',
      description: 'Настоящая Краковская в натуральной череве: отборная полужирная свинина, нежирная говядина, кусочки нежного шпика и дробленый душистый перец.',
      composition: 'Свинина полужирная, говядина, шпик боковой, чеснок свежий, сахар, перец черный, перец душистый, соль.',
      weight: '~ 380-420 г (кольцо)',
      storage: '25 суток при температуре от +2°C до +6°C',
      price: 480,
      old_price: 520,
      badge: 'Семейный рецепт',
      images: ['/images/products/krakovskaya.jpg'],
    },
    {
      catSlug: 'kolbasnye-izdeliya',
      subSlug: 'Сервелат',
      title: 'Сервелат праздничный элитный',
      slug: 'servelat-prazdnichnyy-elitnyy',
      description: 'Мелкозернистый благородный сервелат с деликатным пряным букетом и легким оттенком копчения.',
      composition: 'Свинина высший сорт, говядина нежирная, шпик хребтовой, мускатный орех, кардамон, соль поваренная.',
      weight: '~ 450 г (батончик)',
      storage: '30 суток при температуре от +2°C до +6°C',
      price: 540,
      old_price: null,
      badge: 'Хит',
      images: ['/images/products/servelat.jpg'],
    },
    {
      catSlug: 'kolbasnye-izdeliya',
      subSlug: 'Сосиски',
      title: 'Сосиски сливочные нежные',
      slug: 'sosiski-slivochnye-nezhnye',
      description: 'Нежнейшие домашние сосиски из парного мяса с добавлением натуральных сливок. Идеально подходят детям.',
      composition: 'Свинина нежирная, филе куриной грудки, сливки натуральные 20%, яйцо фермерское, мускатный орех, соль.',
      weight: '450 г (~ 6-7 шт)',
      storage: '15 суток при температуре от +2°C до +6°C',
      price: 380,
      old_price: null,
      badge: 'Детям',
      images: ['/images/products/sosiski.jpg'],
    },
    {
      catSlug: 'kolbasnye-izdeliya',
      subSlug: 'Докторская',
      title: 'Колбаса Докторская классическая',
      slug: 'kolbasa-doktorskaya-klassicheskaya',
      description: 'Та самая Докторская по рецептуре 1936 года: натуральное парное мясо, яйцо, молоко и щепотка мускатного ореха. Никаких фосфатов и усилителей.',
      composition: 'Свинина нежирная, говядина высший сорт, яйцо куриное, молоко коровье цельное, соль, сахар, мускатный орех.',
      weight: '~ 500 г (батончик)',
      storage: '15 суток при температуре от +2°C до +6°C',
      price: 430,
      old_price: null,
      badge: 'ГОСТ 1936',
      images: ['/images/products/doktorskaya.jpg'],
    },
    {
      catSlug: 'kolbasnye-izdeliya',
      subSlug: 'Ветчина',
      title: 'Ветчина рубленая домашняя',
      slug: 'vetchina-rublenaya-domashnyaya',
      description: 'Плотная сочная ветчина из крупных кусочков нежирного свиного окорока с легким ароматом белого перца.',
      composition: 'Свиной окорок рубленый, чеснок сушеный, белый перец, мускат, соль поваренная.',
      weight: '~ 500 г (батончик)',
      storage: '20 суток при температуре от +2°C до +6°C',
      price: 490,
      old_price: null,
      badge: null,
      images: ['/images/products/vetchina.jpg'],
    },

    // Заморозка
    {
      catSlug: 'zamorozka-polufabrikaty',
      subSlug: 'Пельмени',
      title: 'Пельмени домашние ручной лепки',
      slug: 'pelmeni-domashnie-ruchnoy-lepki',
      description: 'Тончайшее эластичное тесто на фермерском яйце и много сочного фарша из свинины и говядины с репчатым луком.',
      composition: 'Начинка: говядина 50%, свинина 50%, лук репчатый, соль, перец черный свежемолотый. Тесто: мука пшеничная в/с, яйцо куриное, вода, масло подсолнечное, соль.',
      weight: '900 г (пакет)',
      storage: '90 суток при температуре не выше -18°C',
      price: 580,
      old_price: 640,
      badge: 'Хит продаж',
      images: ['/images/products/pelmeni.jpg'],
    },
    {
      catSlug: 'zamorozka-polufabrikaty',
      subSlug: 'Хинкали',
      title: 'Хинкали сочные с рубленой говядиной и кинзой',
      slug: 'khinkali-sochnye-s-kinzoy',
      description: 'Настоящие грузинские хинкали с аккуратными складочками. Внутри каждого хинкали — порция наваристого обжигающего бульона.',
      composition: 'Говядина рубленая, лук, кинза свежая, перец красный острый, перец черный, зира, соль. Тесто: мука в/с, вода, соль.',
      weight: '800 г (~ 10 шт)',
      storage: '90 суток при температуре не выше -18°C',
      price: 560,
      old_price: null,
      badge: 'Семейный рецепт',
      images: ['/images/products/khinkali.jpg'],
    },
    {
      catSlug: 'zamorozka-polufabrikaty',
      subSlug: 'Голубцы',
      title: 'Голубцы домашние в нежных капустных листьях',
      slug: 'golubtsy-domashnie-s-myasom',
      description: 'Свежие капустные листья с начинкой из рубленого мяса и круглозерного риса. Готовы к тушению в сметанно-томатном соусе.',
      composition: 'Фарш домашний (свинина/говядина), капуста белокочанная молодая, рис круглозерный, морковь, лук, соль, перец.',
      weight: '850 г (~ 6 шт)',
      storage: '60 суток при температуре не выше -18°C',
      price: 490,
      old_price: null,
      badge: null,
      images: ['/images/products/golubtsy.jpg'],
    },
  ];

  const categoryMap = new Map<string, number>();
  const subcategoryMap = new Map<string, number>();

  let sortIndex = 1;
  for (const cat of seedCategories) {
    const catRes = insertCategory.run(cat.name, cat.slug, cat.description, sortIndex++);
    const catId = Number(catRes.lastInsertRowid);
    categoryMap.set(cat.slug, catId);

    let subIndex = 1;
    for (const sub of cat.subcategories) {
      const subSlug = `${cat.slug}-${subIndex}`;
      const subRes = insertSubcategory.run(catId, sub, subSlug, subIndex++);
      subcategoryMap.set(`${cat.slug}:${sub}`, Number(subRes.lastInsertRowid));
    }
  }

  let pSort = 1;
  for (const p of initialProducts) {
    const catId = categoryMap.get(p.catSlug)!;
    const subId = subcategoryMap.get(`${p.catSlug}:${p.subSlug}`) || null;
    insertProduct.run(
      catId,
      subId,
      p.title,
      p.slug,
      p.description,
      p.composition,
      p.weight,
      p.storage,
      p.price,
      p.old_price,
      JSON.stringify(p.images),
      1,
      p.badge,
      pSort++
    );
  }
}

// Seed default badges if table is empty
const badgesCount = (db.prepare('SELECT COUNT(*) as count FROM badges').get() as { count: number }).count;
if (badgesCount === 0) {
  const insertBadge = db.prepare(`
    INSERT INTO badges (name, bg_color, text_color, border_color, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  const defaultBadges = [
    { name: 'Хит продаж', bg: '#FFF4E5', text: '#B25E09', border: '#FCD34D', sort: 1 },
    { name: 'Семейный рецепт', bg: '#FDF2EB', text: '#C2622A', border: '#F5C7A9', sort: 2 },
    { name: 'Новинка', bg: '#EBF3ED', text: '#3A6347', border: '#B7DDC2', sort: 3 },
    { name: 'ГОСТ 1936', bg: '#FDF2EB', text: '#C2622A', border: '#F5C7A9', sort: 4 },
    { name: 'Рекомендуем', bg: '#FFF4E5', text: '#B25E09', border: '#FCD34D', sort: 5 },
    { name: 'Ограниченная партия', bg: '#F5EBE1', text: '#6E492B', border: '#DECBB9', sort: 6 },
    { name: 'Детям', bg: '#EBF3ED', text: '#3A6347', border: '#B7DDC2', sort: 7 },
  ];
  for (const b of defaultBadges) {
    insertBadge.run(b.name, b.bg, b.text, b.border, b.sort);
  }
}

// Seed default recipes if table is empty
const recipesCount = (db.prepare('SELECT COUNT(*) as count FROM recipes').get() as { count: number }).count;
if (recipesCount === 0) {
  const insertRecipe = db.prepare(`
    INSERT INTO recipes (product_id, title, slug, description, cover_image, video_url, prep_time, portions, difficulty, ingredients, steps, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const beefProduct = db.prepare("SELECT id FROM products WHERE title LIKE '%говяжья%' LIMIT 1").get() as { id: number } | undefined;
  const krakowProduct = db.prepare("SELECT id FROM products WHERE title LIKE '%Краковская%' LIMIT 1").get() as { id: number } | undefined;
  const pelmeniProduct = db.prepare("SELECT id FROM products WHERE title LIKE '%Пельмени%' LIMIT 1").get() as { id: number } | undefined;

  const defaultRecipes = [
    {
      productId: beefProduct ? beefProduct.id : 2,
      title: 'Томленая тушенка с гречкой и лесными грибами',
      slug: 'tushenka-s-grechkoy-i-lesnymi-gribami',
      description: 'Традиционное сытное блюдо русской кухни. Гречневая крупа напитывается прозрачным мясным соком и пряным ароматом отборной говядины длительного автоклавного томления.',
      coverImage: '/images/products/tushenka.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      prepTime: '35 мин',
      portions: '4 порции',
      difficulty: 'Легко',
      ingredients: [
        { name: 'Тушенка говяжья высший сорт «Невдахинъ»', amount: '1 банка (500 г)' },
        { name: 'Гречневая крупа ядрица', amount: '250 г' },
        { name: 'Белые грибы или шампиньоны', amount: '200 г' },
        { name: 'Лук репчатый золотистый', amount: '1 крупная головка' },
        { name: 'Свежая зелень петрушки и укропа', amount: 'по вкусу' },
        { name: 'Соль и свежемолотый черный перец', amount: 'по вкусу' },
      ],
      steps: [
        {
          step_number: 1,
          title: 'Подготовка крупы',
          description: 'Промойте гречневую крупу. Обжарьте на сухой сковороде 2 минуты до появления приятного орехового аромата.',
          tip: 'Прокаливание крупы делает кашу рассыпчатой.',
          image_url: '/images/products/tushenka.jpg',
        },
        {
          step_number: 2,
          title: 'Пассеровка лука и грибов',
          description: 'Снимите верхний прозрачный жирок из банки тушенки «Невдахинъ» и растопите на сковороде. Обжарьте мелко рубленый лук и нарезанные грибы 5 минут.',
          tip: 'Натуральный говяжий смалец из банки намного ароматнее растительного масла.',
          image_url: '/images/products/tushenka.jpg',
        },
        {
          step_number: 3,
          title: 'Добавление томленой говядины',
          description: 'Выложите сочные кусочки тушеного мяса вместе с прозрачным мясным желе в сковороду. Прогрейте 2 минуты, разделяя волокна мяса лопаткой.',
          tip: 'Мясо уже полностью готово и растушено, его не нужно зажаривать.',
          image_url: '/images/products/tushenka.jpg',
        },
        {
          step_number: 4,
          title: 'Томление с гречкой',
          description: 'Всыпьте гречку, влейте 450 мл кипятка, доведите до кипения и томите под крышкой на слабом огне 20 минут. Подавайте со свежей зеленью.',
          tip: 'После выключения плиты укутайте сковороду полотенцем на 10 минут.',
          image_url: '/images/products/tushenka.jpg',
        },
      ],
      sort: 1,
    },
    {
      productId: krakowProduct ? krakowProduct.id : 8,
      title: 'Деревенская яичница с Краковской колбасой и томатами',
      slug: 'derevenskaya-yaichnitsa-s-krakovskoy-kolbasoy',
      description: 'Классический домашний завтрак. Ремесленная колбаса горячего копчения на ольховой щепе дарит блюду неповторимый мясной дух.',
      coverImage: '/images/products/kolbasa.jpg',
      videoUrl: '',
      prepTime: '15 мин',
      portions: '2 порции',
      difficulty: 'Легко',
      ingredients: [
        { name: 'Колбаса Краковская ремесленная «Невдахинъ»', amount: '150 г' },
        { name: 'Яйца фермерские отборные', amount: '4 шт' },
        { name: 'Томаты спелые грунтовые', amount: '2 шт' },
        { name: 'Зеленый лук и укроп', amount: 'несколько перьев' },
        { name: 'Черный свежемолотый перец, крупная соль', amount: 'по вкусу' },
      ],
      steps: [
        {
          step_number: 1,
          title: 'Обжарка кружочков колбасы',
          description: 'Нарежьте краковскую колбасу кружками толщиной 5–6 мм. Обжарьте на сухой чугунной сковороде по 1.5 минуты с каждой стороны до золотистой корочки.',
          tip: 'Колбаса выделит собственный ароматный сок, масло добавлять не нужно.',
          image_url: '/images/products/kolbasa.jpg',
        },
        {
          step_number: 2,
          title: 'Томаты и яйца',
          description: 'Добавьте нарезанные томаты к колбасе на 1 минуту, затем вбейте яйца, стараясь не повредить желтки.',
          tip: 'Готовьте на умеренном огне под полуоткрытой крышкой.',
          image_url: '/images/products/kolbasa.jpg',
        },
        {
          step_number: 3,
          title: 'Подача с пылу с жару',
          description: 'Посыпьте зеленым луком и свежемолотым перцем. Подавайте прямо в сковороде с хрустящим деревенским хлебом.',
          tip: 'Макайте хлеб в жидкий желток, смешанный с копченым мясным соком.',
          image_url: '/images/products/kolbasa.jpg',
        },
      ],
      sort: 2,
    },
    {
      productId: pelmeniProduct ? pelmeniProduct.id : 12,
      title: 'Пельмени ручной лепки с топленым маслом и домашним соусом',
      slug: 'pelmeni-s-toplenym-maslom-i-sousom',
      description: 'Рецепт правильной варки ремесленных пельменей из тонкого теста с сочным рубленым фаршем без потерь мясного бульона.',
      coverImage: '/images/products/pelmeni.jpg',
      videoUrl: '',
      prepTime: '20 мин',
      portions: '3 порции',
      difficulty: 'Легко',
      ingredients: [
        { name: 'Пельмени сибирские ручной лепки «Невдахинъ»', amount: '1 упаковка (800 г)' },
        { name: 'Масло сливочное топленое', amount: '50 г' },
        { name: 'Лавровый лист и душистый перец', amount: '2 листа, 4 горошины' },
        { name: 'Густая домашняя сметана', amount: 'по вкусу' },
        { name: 'Свежая рубленая зелень', amount: 'по вкусу' },
      ],
      steps: [
        {
          step_number: 1,
          title: 'Пряный бульон для варки',
          description: 'Вскипятите в широкой кастрюле 3 литра воды, добавьте 1 ст. ложку соли, лавровый лист и перец. Опускайте пельмени партиями в кипящую воду, аккуратно помешивая.',
          tip: 'Широкая кастрюля гарантирует, что пельмени не помнутся и проварятся равномерно.',
          image_url: '/images/products/pelmeni.jpg',
        },
        {
          step_number: 2,
          title: 'Контроль готовности',
          description: 'После всплытия варите ровно 6–7 минут на среднем огне при умеренном кипении.',
          tip: 'Добавьте полстакана ледяной воды за 1 минуту до готовности — тесто станет нежным и упругим.',
          image_url: '/images/products/pelmeni.jpg',
        },
        {
          step_number: 3,
          title: 'Подача с топленым маслом',
          description: 'Выложите шумовкой в керамическую миску, полейте горячим топленым маслом и посыпьте свежей зеленью. Подавайте со сметаной.',
          tip: 'Ешьте осторожно — внутри каждого пельменя много горячего мясного сока!',
          image_url: '/images/products/pelmeni.jpg',
        },
      ],
      sort: 3,
    },
  ];

  for (const r of defaultRecipes) {
    insertRecipe.run(
      r.productId,
      r.title,
      r.slug,
      r.description,
      r.coverImage,
      r.videoUrl,
      r.prepTime,
      r.portions,
      r.difficulty,
      JSON.stringify(r.ingredients),
      JSON.stringify(r.steps),
      r.sort
    );
  }
}

export default db;
