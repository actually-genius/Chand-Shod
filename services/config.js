import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isPackaged = typeof process.pkg !== 'undefined' || Boolean(process.env.CAXA);
const ROOT_DIR = isPackaged ? process.cwd() : path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Master catalog of all supported items
export const MASTER_ITEMS = [
  // --- FIAT CURRENCIES ---
  {
    code: 'USD',
    key: 'price_dollar_rl',
    name: 'دلار آمریکا',
    nameEn: 'US Dollar',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'دلار بازار آزاد تهران',
  },
  {
    code: 'EUR',
    key: 'price_eur',
    name: 'یورو',
    nameEn: 'Euro',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'یورو اتحادیه اروپا',
  },
  {
    code: 'GBP',
    key: 'price_gbp',
    name: 'پوند انگلیس',
    nameEn: 'British Pound',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'پوند بریتانیا',
  },
  {
    code: 'AED',
    key: 'price_aed',
    name: 'درهم امارات',
    nameEn: 'UAE Dirham',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'درهم امارات متحده عربی',
  },
  {
    code: 'TRY',
    key: 'price_try',
    name: 'لیر ترکیه',
    nameEn: 'Turkish Lira',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'لیر ترکیه',
  },
  {
    code: 'CNY',
    key: 'price_cny',
    name: 'یوان چین',
    nameEn: 'Chinese Yuan',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'یوان چین',
  },
  {
    code: 'CAD',
    key: 'price_cad',
    name: 'دلار کانادا',
    nameEn: 'Canadian Dollar',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'دلار کانادا',
  },
  {
    code: 'AUD',
    key: 'price_aud',
    name: 'دلار استرالیا',
    nameEn: 'Australian Dollar',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'دلار استرالیا',
  },
  {
    code: 'CHF',
    key: 'price_chf',
    name: 'فرانک سوئیس',
    nameEn: 'Swiss Franc',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'فرانک سوئیس',
  },
  {
    code: 'RUB',
    key: 'price_rub',
    name: 'روبل روسیه',
    nameEn: 'Russian Ruble',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: true,
    description: 'روبل فدراسیون روسیه',
  },
  {
    code: 'JPY',
    key: 'price_jpy',
    name: '۱۰۰ ین ژاپن',
    nameEn: 'Japanese Yen (100)',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: '۱۰۰ ین ژاپن',
  },
  {
    code: 'IQD',
    key: 'price_iqd',
    name: '۱۰۰ دینار عراق',
    nameEn: 'Iraqi Dinar (100)',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: '۱۰۰ دینار عراق',
  },
  {
    code: 'KWD',
    key: 'price_kwd',
    name: 'دینار کویت',
    nameEn: 'Kuwaiti Dinar',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'دینار کویت',
  },
  {
    code: 'SAR',
    key: 'price_sar',
    name: 'ریال عربستان',
    nameEn: 'Saudi Riyal',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'ریال عربستان سعودی',
  },
  {
    code: 'QAR',
    key: 'price_qar',
    name: 'ریال قطر',
    nameEn: 'Qatari Rial',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'ریال قطر',
  },
  {
    code: 'AFN',
    key: 'price_afn',
    name: 'افغانی افغانستان',
    nameEn: 'Afghan Afghani',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'افغانی افغانستان',
  },
  {
    code: 'GEL',
    key: 'price_gel',
    name: 'لاری گرجستان',
    nameEn: 'Georgian Lari',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'لاری گرجستان',
  },
  {
    code: 'AZN',
    key: 'price_azn',
    name: 'منات آذربایجان',
    nameEn: 'Azerbaijani Manat',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'منات جمهوری آذربایجان',
  },
  {
    code: 'AMD',
    key: 'price_amd',
    name: 'درام ارمنستان',
    nameEn: 'Armenian Dram',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'درام ارمنستان',
  },
  {
    code: 'INR',
    key: 'price_inr',
    name: 'روپیه هند',
    nameEn: 'Indian Rupee',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'روپیه هند',
  },
  {
    code: 'MYR',
    key: 'price_myr',
    name: 'رینگیت مالزی',
    nameEn: 'Malaysian Ringgit',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'رینگیت مالزی',
  },
  {
    code: 'THB',
    key: 'price_thb',
    name: 'بات تایلند',
    nameEn: 'Thai Baht',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'بات تایلند',
  },
  {
    code: 'SEK',
    key: 'price_sek',
    name: 'کرون سوئد',
    nameEn: 'Swedish Krona',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'کرون سوئد',
  },
  {
    code: 'NOK',
    key: 'price_nok',
    name: 'کرون نروژ',
    nameEn: 'Norwegian Krone',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'کرون نروژ',
  },
  {
    code: 'DKK',
    key: 'price_dkk',
    name: 'کرون دانمارک',
    nameEn: 'Danish Krone',
    category: 'fiat',
    unit: 'toman',
    defaultEnabled: false,
    description: 'کرون دانمارک',
  },

  // --- CRYPTOCURRENCIES ---
  {
    code: 'BTC',
    key: 'crypto-bitcoin-irr',
    usdKey: 'crypto-bitcoin',
    name: 'بیت‌کوین',
    nameEn: 'Bitcoin',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: true,
    description: 'پادشاه رمز ارزها (BTC)',
  },
  {
    code: 'ETH',
    key: 'crypto-ethereum-irr',
    usdKey: 'crypto-ethereum',
    name: 'اتریوم',
    nameEn: 'Ethereum',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: true,
    description: 'قراردادهای هوشمند اتریوم (ETH)',
  },
  {
    code: 'USDT',
    key: 'crypto-tether-irr',
    usdKey: 'crypto-tether',
    name: 'تتر',
    nameEn: 'Tether USDT',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: true,
    description: 'استیبل‌کوین تتر دلاری (USDT)',
  },
  {
    code: 'SOL',
    key: 'crypto-solana-irr',
    usdKey: 'crypto-solana',
    name: 'سولانا',
    nameEn: 'Solana',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: true,
    description: 'بلاک‌چین پرسرعت سولانا (SOL)',
  },
  {
    code: 'TRON',
    key: 'crypto-tron-irr',
    usdKey: 'crypto-tron',
    name: 'ترون',
    nameEn: 'TRON',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: true,
    description: 'ارز ترون (TRX/TRON)',
  },
  {
    code: 'TRX',
    key: 'crypto-tron-irr',
    usdKey: 'crypto-tron',
    name: 'تی آر ایکس (ترون)',
    nameEn: 'TRX (TRON)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: true,
    description: 'نماد اختصاری TRX ترون',
  },
  {
    code: 'DOGE',
    key: 'crypto-dogecoin-irr',
    usdKey: 'crypto-dogecoin',
    name: 'دوج‌کوین',
    nameEn: 'Dogecoin',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: true,
    description: 'میم کوین دوج (DOGE)',
  },
  {
    code: 'GRAM1',
    key: 'crypto-gram-1',
    usdKey: 'crypto-gram-1-usd',
    rowId: '1764279',
    name: 'گرام کریپتو ۱ (پریو. تُن‌کوین)',
    nameEn: 'Gram Token #1 (prev. Toncoin)',
    category: 'crypto',
    subgroup: 'three_grams',
    unit: 'toman',
    defaultEnabled: true,
    description: 'توکن گرام ردیف ۱ در صفحه کریپتو TGJU (شناسه ۱۷۶۴۲۷۹ - Gram prev. Toncoin)',
  },
  {
    code: 'GRAM2',
    key: 'crypto-gram-2',
    usdKey: 'crypto-gram-2-usd',
    rowId: '1764293',
    name: 'گرام کریپتو ۲ (پریو.تُن‌کوین)',
    nameEn: 'Gram Token #2 (prev. Toncoin)',
    category: 'crypto',
    subgroup: 'three_grams',
    unit: 'toman',
    defaultEnabled: true,
    description: 'توکن گرام ردیف ۲ در صفحه کریپتو TGJU (شناسه ۱۷۶۴۲۹۳ - Gram prev. Toncoin)',
  },
  {
    code: 'TON',
    key: 'crypto-toncoin-irr',
    usdKey: 'crypto-toncoin',
    rowId: '764637',
    name: 'تون‌کوین / گرام ۳ (TON)',
    nameEn: 'Toncoin / Gram #3 (TON)',
    category: 'crypto',
    subgroup: 'three_grams',
    unit: 'toman',
    defaultEnabled: true,
    description: 'تون‌کوین تلگرام (ردیف ۳ کریپتو TGJU - سابقاً Gram)',
  },
  {
    code: 'GRAM_CRYPTO',
    key: 'crypto-gram-1',
    usdKey: 'crypto-gram-1-usd',
    rowId: '1764279',
    name: 'گرام کریپتو (عمومی)',
    nameEn: 'Gram Crypto (General / Token #1)',
    category: 'crypto',
    subgroup: 'three_grams',
    unit: 'toman',
    defaultEnabled: true,
    description: 'نماد عمومی گرام کریپتو (منطبق بر توکن ۱)',
  },
  {
    code: 'BNB',
    key: 'crypto-binance-coin-irr',
    usdKey: 'crypto-binance-coin',
    name: 'بایننس کوین',
    nameEn: 'Binance Coin (BNB)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: false,
    description: 'توکن اکوسیستم بایننس (BNB)',
  },
  {
    code: 'XRP',
    key: 'crypto-ripple-irr',
    usdKey: 'crypto-ripple',
    name: 'ریپل',
    nameEn: 'XRP (Ripple)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: false,
    description: 'ارز دیجیتال ریپل (XRP)',
  },
  {
    code: 'ADA',
    key: 'crypto-cardano-irr',
    usdKey: 'crypto-cardano',
    name: 'کاردانو',
    nameEn: 'Cardano (ADA)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: false,
    description: 'بلاک‌چین کاردانو (ADA)',
  },
  {
    code: 'LTC',
    key: 'crypto-litecoin-irr',
    usdKey: 'crypto-litecoin',
    name: 'لایت‌کوین',
    nameEn: 'Litecoin (LTC)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: false,
    description: 'لایت‌کوین نقره دیجیتال (LTC)',
  },
  {
    code: 'SHIB',
    key: 'crypto-shiba-inu-irr',
    usdKey: 'crypto-shiba-inu',
    name: 'شیبا اینو',
    nameEn: 'Shiba Inu (SHIB)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: false,
    description: 'توکن شیبا اینو (SHIB)',
  },
  {
    code: 'DOT',
    key: 'crypto-polkadot-irr',
    usdKey: 'crypto-polkadot',
    name: 'پولکادات',
    nameEn: 'Polkadot (DOT)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: false,
    description: 'شبکه پولکادات (DOT)',
  },
  {
    code: 'AVAX',
    key: 'crypto-avalanche-irr',
    usdKey: 'crypto-avalanche',
    name: 'آوالانچ',
    nameEn: 'Avalanche (AVAX)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: false,
    description: 'بلاک‌چین آوالانچ (AVAX)',
  },
  {
    code: 'LINK',
    key: 'crypto-chainlink-irr',
    usdKey: 'crypto-chainlink',
    name: 'چین‌لینک',
    nameEn: 'Chainlink (LINK)',
    category: 'crypto',
    unit: 'toman',
    defaultEnabled: false,
    description: 'اوراکل چین‌لینک (LINK)',
  },

  // --- GOLD & COINS (طلا و سکه) ---
  // THE THREE GRAMS (specifically requested! Imported all so user can disable wrong ones)
  {
    code: 'GERAM18',
    key: 'geram18',
    name: 'گرم طلای ۱۸ عیار',
    nameEn: '18K Gold Gram',
    category: 'gold',
    subgroup: 'three_grams',
    unit: 'toman',
    defaultEnabled: true,
    description: 'گرم طلای ۱۸ عیار (گرم اول طلا)',
  },
  {
    code: 'GERAM24',
    key: 'geram24',
    name: 'گرم طلای ۲۴ عیار',
    nameEn: '24K Gold Gram',
    category: 'gold',
    subgroup: 'three_grams',
    unit: 'toman',
    defaultEnabled: true,
    description: 'گرم طلای ۲۴ عیار خالص (گرم دوم طلا)',
  },
  {
    code: 'GERAMI',
    key: 'gerami',
    name: 'سکه گرمی',
    nameEn: 'Gerami Coin',
    category: 'coin',
    subgroup: 'three_grams',
    unit: 'toman',
    defaultEnabled: true,
    description: 'سکه گرمی بانک مرکزی (سکه، نه طلای خام)',
  },
  {
    code: 'RETAIL_GERAMI',
    key: 'retail_gerami',
    name: 'سکه گرمی (تک‌فروشی)',
    nameEn: 'Retail Gerami Coin',
    category: 'coin',
    subgroup: 'three_grams',
    unit: 'toman',
    defaultEnabled: true,
    description: 'سکه گرمی در بازار تک‌فروشی (سکه، نه طلای خام)',
  },

  // Standard Iranian Gold
  {
    code: 'MESGHAL',
    key: 'mesghal',
    name: 'مثقال طلا',
    nameEn: 'Gold Mesghal',
    category: 'gold',
    unit: 'toman',
    defaultEnabled: true,
    description: 'یک مثقال طلا (۴.۶۰۸ گرم طلای ۱۷ عیار)',
  },
  {
    code: 'GOLD_MELTED',
    key: 'gold_melted_wholesale',
    name: 'طلا آبشده نقدی',
    nameEn: 'Melted Gold Wholesale',
    category: 'gold',
    unit: 'toman',
    defaultEnabled: true,
    description: 'طلای آبشده نقدی عمده',
  },
  {
    code: 'TGJU_GOLD18',
    key: 'tgju_gold_irg18',
    name: 'طلای ۱۸ عیار / ۷۵۰',
    nameEn: 'Gold 18K / 750',
    category: 'gold',
    unit: 'toman',
    defaultEnabled: true,
    description: 'مظنه طلای ۱۸ عیار استاندارد ۷۵۰',
  },
  {
    code: 'GOLD_740K',
    key: 'gold_740k',
    name: 'طلای دست دوم (۷۴۰)',
    nameEn: 'Second-hand Gold 740',
    category: 'gold',
    unit: 'toman',
    defaultEnabled: false,
    description: 'طلای دست دوم و مستعمل ۷۴۰',
  },
  {
    code: 'GOLD_MINI',
    key: 'gold_mini_size',
    name: 'آبشده کمتر از کیلو',
    nameEn: 'Melted Gold Mini',
    category: 'gold',
    unit: 'toman',
    defaultEnabled: false,
    description: 'طلای آبشده در اوزان خرد',
  },

  // Iranian Coins (سکه)
  {
    code: 'SEKEE',
    key: 'sekee',
    name: 'سکه امامی (طرح جدید)',
    nameEn: 'Emami Coin',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: true,
    description: 'تمام سکه بهار آزادی طرح جدید (امامی)',
  },
  {
    code: 'SEKEB',
    key: 'sekeb',
    name: 'سکه بهار آزادی (طرح قدیم)',
    nameEn: 'Bahar Azadi Coin',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: true,
    description: 'تمام سکه بهار آزادی طرح قدیم',
  },
  {
    code: 'NIM',
    key: 'nim',
    name: 'نیم سکه بهار آزادی',
    nameEn: 'Half Bahar Azadi Coin',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: true,
    description: 'نیم سکه بهار آزادی',
  },
  {
    code: 'ROB',
    key: 'rob',
    name: 'ربع سکه بهار آزادی',
    nameEn: 'Quarter Bahar Azadi Coin',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: true,
    description: 'ربع سکه بهار آزادی',
  },
  {
    code: 'RETAIL_SEKEE',
    key: 'retail_sekee',
    name: 'سکه امامی (تک‌فروشی)',
    nameEn: 'Retail Emami Coin',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: false,
    description: 'سکه امامی بازار تک‌فروشی',
  },
  {
    code: 'RETAIL_SEKEB',
    key: 'retail_sekeb',
    name: 'سکه بهار آزادی (تک‌فروشی)',
    nameEn: 'Retail Bahar Azadi Coin',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: false,
    description: 'سکه بهار آزادی بازار تک‌فروشی',
  },
  {
    code: 'RETAIL_NIM',
    key: 'retail_nim',
    name: 'نیم سکه (تک‌فروشی)',
    nameEn: 'Retail Half Coin',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: false,
    description: 'نیم سکه بازار تک‌فروشی',
  },
  {
    code: 'RETAIL_ROB',
    key: 'retail_rob',
    name: 'ربع سکه (تک‌فروشی)',
    nameEn: 'Retail Quarter Coin',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: false,
    description: 'ربع سکه بازار تک‌فروشی',
  },

  // Coin Bubbles (حباب سکه)
  {
    code: 'SEKEB_BLUBBER',
    key: 'sekeb_blubber',
    name: 'حباب سکه بهار آزادی',
    nameEn: 'Bahar Azadi Bubble',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: false,
    description: 'میزان حباب قیمت سکه بهار آزادی',
  },
  {
    code: 'NIM_BLUBBER',
    key: 'nim_blubber',
    name: 'حباب نیم سکه',
    nameEn: 'Half Coin Bubble',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: false,
    description: 'میزان حباب قیمت نیم سکه',
  },
  {
    code: 'ROB_BLUBBER',
    key: 'rob_blubber',
    name: 'حباب ربع سکه',
    nameEn: 'Quarter Coin Bubble',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: false,
    description: 'میزان حباب قیمت ربع سکه',
  },
  {
    code: 'GERAMI_BLUBBER',
    key: 'gerami_blubber',
    name: 'حباب سکه گرمی',
    nameEn: 'Gerami Coin Bubble',
    category: 'coin',
    unit: 'toman',
    defaultEnabled: false,
    description: 'میزان حباب قیمت سکه گرمی',
  },

  // Global Gold & Precious Metals
  {
    code: 'ONS',
    key: 'ons',
    name: 'انس جهانی طلا',
    nameEn: 'Gold Ounce (USD)',
    category: 'gold',
    unit: 'usd',
    defaultEnabled: true,
    description: 'قیمت هر انس جهانی طلا به دلار آمریکا',
  },
  {
    code: 'SILVER_ONS',
    key: 'silver',
    name: 'انس جهانی نقره',
    nameEn: 'Silver Ounce (USD)',
    category: 'gold',
    unit: 'usd',
    defaultEnabled: true,
    description: 'قیمت هر انس جهانی نقره به دلار آمریکا',
  },
  {
    code: 'SILVER_999',
    key: 'silver_999',
    name: 'نقره ۹۹۹ (گرم)',
    nameEn: 'Silver 999 Gram',
    category: 'gold',
    unit: 'toman',
    defaultEnabled: true,
    description: 'هر گرم نقره خالص ۹۹۹ در ایران به تومان',
  },
  {
    code: 'SILVER_925',
    key: 'silver_925',
    name: 'نقره ۹۲۵ (گرم)',
    nameEn: 'Silver 925 Gram',
    category: 'gold',
    unit: 'toman',
    defaultEnabled: false,
    description: 'هر گرم نقره عیار ۹۲۵ به تومان',
  },
  {
    code: 'PLATINUM',
    key: 'platinum',
    name: 'انس پلاتین',
    nameEn: 'Platinum Ounce (USD)',
    category: 'gold',
    unit: 'usd',
    defaultEnabled: false,
    description: 'قیمت هر انس پلاتین جهانی به دلار آمریکا',
  },
  {
    code: 'PALLADIUM',
    key: 'palladium',
    name: 'انس پالادیوم',
    nameEn: 'Palladium Ounce (USD)',
    category: 'gold',
    unit: 'usd',
    defaultEnabled: false,
    description: 'قیمت هر انس پالادیوم جهانی به دلار آمریکا',
  },
  {
    code: 'PAXG',
    key: 'crypto_paxg_gold',
    name: 'پکس گلد (کریپتو طلا)',
    nameEn: 'PAX Gold (PAXG)',
    category: 'gold',
    unit: 'usd',
    defaultEnabled: true,
    description: 'ارز دیجیتال با پشتوانه یک انس طلا (PAXG)',
  },
  {
    code: 'XAUT',
    key: 'tether_gold_xaut',
    name: 'تتر طلا (XAUT)',
    nameEn: 'Tether Gold (XAUT)',
    category: 'gold',
    unit: 'usd',
    defaultEnabled: true,
    description: 'ارز دیجیتال طلای تتر (XAUT)',
  },
];

class ConfigService {
  constructor() {
    this.config = this.loadConfig();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  getDefaultConfig() {
    const enabledItems = {};
    for (const item of MASTER_ITEMS) {
      enabledItems[item.code] = item.defaultEnabled;
    }
    return {
      scrapeIntervalSeconds: 60,
      autoScrape: true,
      tgjuUrl: 'https://call4.tgju.org/ajax.json',
      timeoutSeconds: 15,
      enabledItems,
    };
  }

  loadConfig() {
    this.ensureDataDir();
    if (!fs.existsSync(CONFIG_FILE)) {
      const def = this.getDefaultConfig();
      this.saveConfig(def);
      return def;
    }
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // Merge with master items to pick up any new symbols
      const mergedEnabled = {};
      for (const item of MASTER_ITEMS) {
        if (data.enabledItems && Object.prototype.hasOwnProperty.call(data.enabledItems, item.code)) {
          mergedEnabled[item.code] = Boolean(data.enabledItems[item.code]);
        } else {
          mergedEnabled[item.code] = item.defaultEnabled;
        }
      }
      return {
        scrapeIntervalSeconds: data.scrapeIntervalSeconds || 60,
        autoScrape: data.autoScrape !== undefined ? data.autoScrape : true,
        tgjuUrl: data.tgjuUrl || 'https://call4.tgju.org/ajax.json',
        timeoutSeconds: data.timeoutSeconds || 15,
        enabledItems: mergedEnabled,
      };
    } catch (err) {
      console.error('Error loading config file, resetting to default:', err);
      const def = this.getDefaultConfig();
      this.saveConfig(def);
      return def;
    }
  }

  saveConfig(newConfig = this.config) {
    this.ensureDataDir();
    this.config = newConfig;
    const tmpFile = `${CONFIG_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(this.config, null, 2), 'utf-8');
    fs.renameSync(tmpFile, CONFIG_FILE);
    return this.config;
  }

  getConfig() {
    return { ...this.config };
  }

  getMasterItems() {
    return MASTER_ITEMS.map((item) => ({
      ...item,
      enabled: Boolean(this.config.enabledItems[item.code]),
    }));
  }

  setItemEnabled(code, enabled) {
    const found = MASTER_ITEMS.find((i) => i.code === code);
    if (!found) {
      throw new Error(`Item ${code} not found in master catalog`);
    }
    this.config.enabledItems[code] = Boolean(enabled);
    this.saveConfig();
    return { code, enabled: this.config.enabledItems[code] };
  }

  setMultipleItemsEnabled(updates) {
    for (const [code, enabled] of Object.entries(updates)) {
      const found = MASTER_ITEMS.find((i) => i.code === code);
      if (found) {
        this.config.enabledItems[code] = Boolean(enabled);
      }
    }
    this.saveConfig();
    return this.config.enabledItems;
  }

  bulkToggleCategory(category, enabled) {
    for (const item of MASTER_ITEMS) {
      if (category === 'all' || item.category === category) {
        this.config.enabledItems[item.code] = Boolean(enabled);
      }
    }
    this.saveConfig();
    return this.getMasterItems();
  }

  setScrapeInterval(seconds) {
    const val = parseInt(seconds, 10);
    if (isNaN(val) || val < 5 || val > 3600) {
      throw new Error('Interval must be between 5 and 3600 seconds');
    }
    this.config.scrapeIntervalSeconds = val;
    this.saveConfig();
    return this.config.scrapeIntervalSeconds;
  }

  setAutoScrape(enabled) {
    this.config.autoScrape = Boolean(enabled);
    this.saveConfig();
    return this.config.autoScrape;
  }
}

export const configService = new ConfigService();
