// ============================================================================
// SINTONIZE — Worker modelo (cada pessoa hospeda o seu na própria Cloudflare)
// Versão 1.0.1
//
// O QUE VOCÊ PRECISA CONFIGURAR NA CLOUDFLARE (o tutorial explica passo a passo):
//   Secrets (Settings > Variables and secrets):
//     TMDB_API_KEY    -> sua chave gratuita do TMDB (themoviedb.org)
//     ADMIN_PASSWORD  -> a senha que você vai digitar para entrar no painel
//   Binding (Settings > Bindings > KV namespace):
//     CACHE           -> um KV namespace (o nome da VARIÁVEL tem que ser CACHE)
//   Variables opcionais (Settings > Variables and secrets, tipo "Text"):
//     LOGO_URL                -> link direto (HTTPS) da sua logo. Tem prioridade sobre o código.
//     COLLECTION_TEMPLATE_URL -> link raw do collection-template.json, se você usar outro repositório.
//
// ENDEREÇOS DO SEU WORKER:
//   /            -> página de status (mostra se está tudo configurado)
//   /admin       -> painel de administração
//   /manifest.json -> manifesto do addon (é o que você instala no Nuvio)
//   /collection.json -> collection do Nuvio já apontando para este Worker
//
// Nenhuma chave, senha ou addon pessoal fica escrito neste arquivo.
//
// Base de collection feita por Kaptain (https://github.com/ImKaptain).
// Metadados: este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
// ============================================================================

const VERSION = '1.0.1';

// Arquivo público do repositório que informa a versão mais recente. Não precisa mudar.
const VERSION_URL = 'https://raw.githubusercontent.com/willianmenegazzifloy-create/sintonize/main/version.json';

// Linha ORIGIN: catálogo público do Nuvio, usado como reserva para detalhes.
const ORIGIN = 'https://catalog.nuvio.tv/%7B%22language%22%3A%22pt-BR%22%2C%22region%22%3A%22BR%22%7D';

const LANG = 'pt-BR';

// Logo do Sintonize (painel, página de status e manifesto).
// Ordem de prioridade: 1) variável LOGO_URL no Cloudflare, 2) o link abaixo, 3) uma logo simples embutida.
// Use um link DIRETO e permanente da imagem (termina em .jpg, .png ou .webp), por exemplo
// https://i.imgur.com/XXXXXXX.png ou https://raw.githubusercontent.com/... (links do Discord expiram).
const SINTONIZE_LOGO = 'https://i.imgur.com/VCh8Upn.jpeg';

// Logo simples embutida, usada quando nenhum link de logo foi definido (nunca fica imagem quebrada).
const FALLBACK_LOGO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#161616"/><path d="M14 40c6-14 10-14 18 0s12 14 18 0" fill="none" stroke="#f4f4f4" stroke-width="4" stroke-linecap="round"/></svg>');

function logoUrl(env) {
  for (const candidate of [env && env.LOGO_URL, SINTONIZE_LOGO]) {
    const value = String(candidate || '').trim();
    if (!value) continue;
    try {
      const u = new URL(value);
      if (u.protocol === 'https:') return u.toString();
    } catch { /* link inválido: tenta o próximo */ }
  }
  return FALLBACK_LOGO;
}

// Link raw do collection-template.json no GitHub (o tutorial explica como obter).
// Repositório esperado: github.com/willianmenegazzifloy-create/sintonize (arquivo collection-template.json na raiz, branch main).
// Quem usar outro repositório pode definir a variável COLLECTION_TEMPLATE_URL no Cloudflare.
const COLLECTION_TEMPLATE_URL = 'https://raw.githubusercontent.com/willianmenegazzifloy-create/sintonize/main/collection-template.json';

const KAPTAIN_URL = 'https://github.com/ImKaptain';

const SINTONIZE_FORMATTER_PRESETS = {
  "aiostreamsGdrive": {
    "_label": "AIOStreams · Google Drive (oficial)",
    "name": "{stream.proxied[\"🕵️ \"||\"\"]}{stream.private[\"🔑 \"||\"\"]}{stream.type::=p2p[\"[P2P] \"||\"\"]}{?[{service.shortName}?}{service.cached[\"⚡] \"||\"⏳] \"]}{addon.name}{stream.library[\" (Your Media)\"||\"\"]} {?{stream.resolution}?}{stream.seadexBest[\" (Best)\"||\"\"]}{stream.seadex::and::stream.seadexBest::isfalse[\" (SeaDex Alt.)\"||\"\"]}{stream.rseMatched::exists::and::stream.seadex::isfalse::and::stream.rseMatched::string::~T1::or::stream.rseMatched::string::~T2::or::stream.rseMatched::string::~T3::or::stream.rseMatched::string::~T4::or::stream.rseMatched::string::~T5::or::stream.rseMatched::string::~T6::or::stream.rseMatched::string::~T7::or::stream.rseMatched::string::~T8[\" ({stream.rseMatched::first})\"||\"\"]}{stream.regexMatched::exists::and::stream.rseMatched::exists::isfalse::and::stream.seadex::isfalse[\" ({stream.regexMatched})\"||\"\"]}",
    "description": "{?🎥 {stream.quality} ?}{?🎞️ {stream.encode} ?}{?🏷️ {stream.releaseGroup} ?}{?📡 {stream.network} ?}{stream.editions::exists[\"🏆 {stream.editions::join(' | ')} \"||\"\"]}\n{?📺 {stream.visualTags::join(' | ')} ?}{?🎧 {stream.audioTags::join(' | ')} ?}{?🔊 {stream.audioChannels::join(' | ')}?}\n{stream.size::>0[\"📦 {stream.size::sbytes} \"||\"\"]}{stream.folderSize::>0[\"/ {stream.folderSize::sbytes} \"||\"\"]}{stream.bitrate::>0[\"({stream.bitrate::sbitrate})\"||\"\"]}{stream.duration::>0[\"⏱️ {stream.duration::time} \"||\"\"]}{stream.seeders::>0[\"👥 {stream.seeders} \"||\"\"]}{?📅 {stream.age} ?}{?🔍 {stream.indexer}?}\n{?🌎 {stream.languages::join(' | ')}?}{?📝 {stream.subtitles::join(' | ')}?}\n{stream.filename::exists[\"📁\"||\"\"]} {?{stream.folderName}/?}{?{stream.filename}?}\n{?ℹ️ {stream.message}?}\n      "
  },
  "aiostreamsLightGdrive": {
    "_label": "AIOStreams · Light Google Drive (oficial)",
    "name": "{stream.proxied[\"🕵️ \"||\"\"]}{stream.private[\"🔑 \"||\"\"]}{stream.type::=p2p[\"[P2P] \"||\"\"]}{?[{service.shortName}?}{stream.library[\"☁️\"||\"\"]}{service.cached[\"⚡] \"||\"⏳] \"]}{addon.name}{? {stream.resolution}?}{stream.seadexBest[\" (Best)\"||\"\"]}{stream.seadex::and::stream.seadexBest::isfalse[\" (SeaDex Alt.)\"||\"\"]}{stream.rseMatched::exists::and::stream.seadex::isfalse::and::stream.rseMatched::string::~T1::or::stream.rseMatched::string::~T2::or::stream.rseMatched::string::~T3::or::stream.rseMatched::string::~T4::or::stream.rseMatched::string::~T5::or::stream.rseMatched::string::~T6::or::stream.rseMatched::string::~T7::or::stream.rseMatched::string::~T8[\" ({stream.rseMatched::first})\"||\"\"]}{stream.regexMatched::exists::and::stream.rseMatched::exists::isfalse::and::stream.seadex::isfalse[\" ({stream.regexMatched})\"||\"\"]}",
    "description": "{?📁 {stream.title::title}?}{? ({stream.year})?}{? {stream.seasonEpisode::join(' • ')}?}\n{?🎥 {stream.quality} ?}{?🎞️ {stream.encode} ?}{?🏷️ {stream.releaseGroup}?}{?📡 {stream.network} ?}{stream.editions::exists[\" 🏆 {stream.editions::join(' • ')}\"||\"\"]}\n{?📺 {stream.visualTags::join(' • ')} ?}{?🎧 {stream.audioTags::join(' • ')} ?}{?🔊 {stream.audioChannels::join(' • ')}?}\n{stream.size::>0[\"📦 {stream.size::sbytes} \"||\"\"]}{stream.folderSize::>0[\"/ {stream.folderSize::sbytes} \"||\"\"]}{stream.duration::>0[\"⏱️ {stream.duration::time} \"||\"\"]}{?📅 {stream.age} ?}{?🔍 {stream.indexer}?}\n{?🌐 {stream.languageEmojis::join(' / ')}?}{stream.subtitles::exists[\"📝 {stream.subtitleEmojis::join(' / ')}\"||\"\"]}\n{?ℹ️ {stream.message}?}"
  },
  "sintonizePro": {
    "_label": "Sintonize Pro · inspirado no AIOStreams",
    "name": "{stream.proxied[\"🕵️ \"||\"\"]}{stream.private[\"🔐 \"||\"\"]}{stream.type::=p2p[\"P2P · \"||\"\"]}{?[{service.shortName}?}{service.cached[\"⚡] \"||\"⏳] \"]}{addon.name}{stream.library[\" · Na biblioteca\"||\"\"]}{? · {stream.resolution}?}{stream.seadexBest[\" · BEST\"||\"\"]}{stream.seadex::and::stream.seadexBest::isfalse[\" · SEADEX\"||\"\"]}",
    "description": "{?🎬 {stream.title::title} ?}{? ({stream.year})?}{? · {stream.seasonEpisode::join(' · ')}?}{tools.newLine}{?🎥 {stream.quality}?}{? · {stream.encode}?}{? · {stream.releaseGroup}?}{? · {stream.visualTags::join(' · ')}?}{? · {stream.audioTags::join(' · ')}?}{? · {stream.audioChannels::join(' · ')}?}{tools.newLine}{stream.size::>0[\"📦 {stream.size::sbytes}\"||\"\"]}{stream.bitrate::>0[\" · {stream.bitrate::sbitrate}\"||\"\"]}{stream.seeders::>0[\" · ↑ {stream.seeders}\"||\"\"]}{? · 🌍 {stream.languages::join(' / ')}?}{? · 📝 {stream.subtitles::join(' / ')}?}{tools.newLine}{?📁 {stream.filename::truncate(140)}?}{? · 🔍 {stream.indexer}?}{? · 💬 {stream.message}?}"
  },
  "original": {
    "_label": "Compacto · estilo tipográfico",
    "name": "{stream.resolution::exists[\"{stream.resolution::replace('2160p','   4K ')::replace('1440p','    2K ')::replace('p','P')}‍\"||\"‍     \"]}{?‍{stream.type::replace('debrid','    ')::replace('p2p','⁽ᵖ²ᵖ⁾')::replace('live','⁽ˡᶦᵛᵉ⁾')::replace('http','⁽ʷᵉᵇ⁾')::replace('usenet','‍⁽ⁿᶻᵇ⁾‍')::replace('stremio-usenet','‏⁽ⁿᶻᵇ⁾')::replace('info','⁽ᶦⁿᶠᵒ⁾')::replace('statistic','⁽ˢᵗᵃᵗˢ⁾')::replace('external','⁽ᵉˣᵗ⁾')::replace('error','⁽ᵉʳʳᵒʳ⁾')::replace('youtube','⁽ʸᵗ⁾')}‍‍‍?}{service.cached[\"⚡\"||\"‍⏳‍​\"||\"\"]}{?‍‍\n  〈{stream.quality::title::replace('Bluray Remux','Remux')::replace('Web-dl','Web‍-‍dl')::replace('Hc Hd-rip','HC HDRip')::replace('Hdrip','HDRip')}〉‍     ?}{stream.message::~Download[\"{tools.removeLine}\n​\"||\"\"]}{?‍\n  {stream.nSeScore::star::replace('⯪','☆')}            ?}{stream.message::~Download[\"{tools.removeLine}\n​\"||\"\"]}",
    "description": "{stream.title::exists[\"{stream.library::istrue[\"☁︎\"||\"{stream.preloading::istrue[\"➤\"||\"✎\"]}\"]}  {stream.date::exists[\"{stream.title::title::truncate(25)}\"||\"{stream.title::title::truncate(20)}\"]}\"||\"\"]}{? · {stream.country} ?}{metadata.queryType::~series[\"{stream.date::exists[\"\n▦  {stream.date::date('%-d %b %Y')}\"||\"\"]}\"||\"{stream.date::exists[\"▦  {stream.date::date('%-d %b %Y')} \"||\"{? ({stream.year::replace('-20', '-')::replace('-19', '-')}) ?}\"]}\"]}{?  {stream.seasonEpisode::join('·')::replace('E','ᴇ')::replace('S','s')::translate('0123456789','₀₁₂₃₄₅₆₇₈₉')}?}\n{?▣  {stream.encode} ?}{stream.visualTags::exists[\"{stream.visualTags::in('DV','HLG','HDR','HDR10','HDR10+')[\"✦ \"||\"✧ \"]}{stream.visualTags::sort::join(' · ')::replace('HDR · HDR','HDR')::replace('HDR10 · HDR10','HDR10')}  \"||\"\"]}{stream.visualTags::sort::join(' · ')::replace('HDR · HDR','HDR')::replace('HDR10 · HDR10','HDR10')::length::<=6::and::stream.audioTags::lsort::join(' · ')::replace('DD · DD','DD')::replace('DTS · DTS','DTS')::length::<=10::and::stream.audioChannels::length::<=2[\"{?♬ {stream.audioTags::lsort::join(' · ')::replace('DD · DD','DD')::replace('DTS · DTS','DTS')}?}{?  ♯ {stream.audioChannels::rsort::join(' · ')}?}\"||\"\"]}\n{stream.visualTags::sort::join(' · ')::replace('HDR · HDR','HDR')::replace('HDR10 · HDR10','HDR10')::length::>6::or::stream.audioTags::lsort::join(' · ')::replace('DD · DD','DD')::replace('DTS · DTS','DTS')::length::>10::or::stream.audioTags::lsort::join(' · ')::replace('DD · DD','DD')::replace('DTS · DTS','DTS')::length::>10::or::stream.audioChannels::length::>2[\"{?♬  {stream.audioTags::lsort::join(' · ')::replace('DD · DD','DD')::replace('DTS · DTS','DTS')}?}{?  ♯ {stream.audioChannels::rsort::join(' · ')}?}\"||\"\"]}\n{stream.size::>0[\"{stream.seasonPack[\"❖ \"||\"◈ \"||\"\"]}{stream.size::>0::and::stream.folderSize::>0::and::stream.size::sbytes::~GB::and::stream.folderSize::sbytes::~GB[\"{stream.size::sbytes::replace(' GB','')}\"||\"{stream.size::sbytes}\"]}\"||\"\"]}{stream.folderSize::>0[\" / {stream.folderSize::sbytes}\"||\"\"]}{? · {stream.bitrate::sbitrate::replace('Mbps','ᴹᵇᵖˢ')::replace('Kbps','ᴷᵇᵖˢ')}?}{stream.message::~Download[\"{tools.removeLine}\"||\"\"]}{service.cached::isfalse::or::stream.type::=p2p::and::stream.seeders::>0[\"⇄ {stream.seeders}❦\"||\"\"]}{? · {stream.age}?}\n{stream.proxied[\"⛊ \"||\"⛉ \"]}{?[{service.shortName}] ?}{addon.name}{stream.private[\" ⚿ ᴘʀɪᴠᴀᴛᴇ \"||\"\"]}{? · {stream.releaseGroup::truncate(13)}?}{stream.indexer::exists[\" · {stream.indexer::truncate(13)}\"||\"\"]}{stream.message::~Download[\"{tools.removeLine}\n\"||\"\"]}"
  }
};
const DEFAULT_SINTONIZE_FORMATTER = SINTONIZE_FORMATTER_PRESETS.sintonizePro;
function sanitizeFormatterPack(value) {
  if (!value || typeof value !== 'object' || typeof value.name !== 'string' || typeof value.description !== 'string') return null;
  if (!value.name.trim() || !value.description.trim() || value.name.length > 20000 || value.description.length > 40000) return null;
  const label = typeof value._label === 'string' && value._label.trim() ? value._label.trim().slice(0, 120) : 'Formatter importado';
  return { name: value.name, description: value.description, _label: label };
}
const PAGE_SIZE = 20;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const JSON_HEADERS = { ...CORS, 'Content-Type': 'application/json; charset=utf-8' };

// Comparação de texto em tempo constante (para a senha do painel).
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

// ---------- Gêneros (nome em português -> ID do TMDB) ----------

const MOVIE_GENRES = {
  'Ação': 28, 'Aventura': 12, 'Animação': 16, 'Comédia': 35, 'Crime': 80,
  'Documentário': 99, 'Drama': 18, 'Família': 10751, 'Fantasia': 14,
  'História': 36, 'Terror': 27, 'Música': 10402, 'Mistério': 9648,
  'Romance': 10749, 'Ficção científica': 878, 'Cinema TV': 10770,
  'Suspense': 53, 'Guerra': 10752, 'Faroeste': 37,
};

const TV_GENRES = {
  'Ação e Aventura': 10759, 'Animação': 16, 'Comédia': 35, 'Crime': 80,
  'Documentário': 99, 'Drama': 18, 'Família': 10751, 'Infantil': 10762,
  'Mistério': 9648, 'Notícias': 10763, 'Reality': 10764,
  'Sci-Fi e Fantasia': 10765, 'Novela': 10766, 'Talk Show': 10767,
  'Guerra e Política': 10768, 'Faroeste': 37,
};

const ALL = 'Todos';

// ---------- Manifesto (fixo, não depende do addon original) ----------

const discoverExtra = (genres) => [
  { name: 'genre', isRequired: true, options: [ALL, ...Object.keys(genres)], optionsLimit: 1 },
  { name: 'skip', isRequired: false },
];

const searchExtra = [
  { name: 'search', isRequired: true },
  { name: 'skip', isRequired: false },
];

// Marca o catálogo como "não mostrar na Home".
const hiddenFromHome = (c) => ({
  ...c,
  showInHome: false,
  extraRequired: c.extra.filter((e) => e.isRequired).map((e) => e.name),
  extraSupported: c.extra.map((e) => e.name),
});

const MANIFEST = {
  id: 'com.meuaddon.nuvio.meta',
  version: '6.0.0',
  name: 'Nuvio Meta (sem catálogos)',
  description: 'Detalhes, Busca e Descobrir em português, via TMDB.',
  resources: [
    'catalog',
    { name: 'meta', types: ['movie', 'series'], idPrefixes: ['tt', 'tmdb:'] },
  ],
  types: ['movie', 'series'],
  catalogs: [
    { type: 'movie', id: 'busca-filmes', name: 'Busca - Filmes', extra: searchExtra },
    { type: 'series', id: 'busca-series', name: 'Busca - Séries', extra: searchExtra },
    { type: 'movie', id: 'descobrir-filmes-populares', name: 'Populares', extra: discoverExtra(MOVIE_GENRES) },
    { type: 'movie', id: 'descobrir-filmes-melhores', name: 'Mais bem avaliados', extra: discoverExtra(MOVIE_GENRES) },
    { type: 'movie', id: 'descobrir-filmes-lancamentos', name: 'Lançamentos', extra: discoverExtra(MOVIE_GENRES) },
    { type: 'series', id: 'descobrir-series-populares', name: 'Populares', extra: discoverExtra(TV_GENRES) },
    { type: 'series', id: 'descobrir-series-melhores', name: 'Mais bem avaliados', extra: discoverExtra(TV_GENRES) },
    { type: 'series', id: 'descobrir-series-lancamentos', name: 'Lançamentos', extra: discoverExtra(TV_GENRES) },
  ].map(hiddenFromHome),
  behaviorHints: { configurable: false, adult: false, p2p: false },
};

// ---------- Utilidades ----------

const img = (path, size) => (path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined);
const iso = (d) => (d ? new Date(d).toISOString() : undefined);
const today = () => new Date().toISOString().slice(0, 10);

async function tmdb(path, env, params = {}) {
  const u = new URL('https://api.themoviedb.org/3' + path);
  u.searchParams.set('api_key', env.TMDB_API_KEY);
  u.searchParams.set('language', LANG);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u.toString(), { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!r.ok) throw new Error('TMDB ' + r.status);
  return r.json();
}

// ---------- Cache (Workers KV) ----------

const HOUR = 3600;
const DAY = 86400;

async function cacheGet(env, key) {
  if (!env.CACHE) return null;
  try {
    return await env.CACHE.get(key, 'json');
  } catch (e) {
    return null;
  }
}

async function cachePut(env, key, value) {
  if (!env.CACHE) return;
  try {
    await env.CACHE.put(key, JSON.stringify(value), { expirationTtl: 30 * DAY });
  } catch (e) {
    // limite diário do KV atingido ou falha pontual: segue sem cache
  }
}

// Devolve do cache na hora. Se o dado já passou do prazo, devolve o antigo
// mesmo assim e atualiza em segundo plano, então a tela nunca espera.
async function cached(env, ctx, key, freshSeconds, produce) {
  const hit = await cacheGet(env, key);
  if (hit && hit.v) {
    const age = (Date.now() - hit.t) / 1000;
    if (age > freshSeconds) {
      ctx.waitUntil(
        (async () => {
          try {
            const v = await produce();
            if (v) await cachePut(env, key, { t: Date.now(), v });
          } catch (e) {
            // mantém o antigo
          }
        })()
      );
    }
    return hit.v;
  }
  const v = await produce();
  if (v) ctx.waitUntil(cachePut(env, key, { t: Date.now(), v }));
  return v;
}

// ---------- Busca inteligente ----------

const normalize = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function sim(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (b.startsWith(a)) return 0.92;
  if (b.includes(a)) return 0.85;
  return Math.max(0, 1 - lev(a, b) / Math.max(a.length, b.length));
}

// Variações da busca para tolerar erros de digitação.
function queryVariants(q) {
  const norm = normalize(q);
  const words = norm.split(' ').filter(Boolean);
  const set = new Set([q, norm]);
  const cut = (w) => (w.length >= 5 ? w.slice(0, Math.max(4, Math.ceil(w.length * 0.7))) : w);
  if (words.length) {
    const byLen = [...words].sort((a, b) => b.length - a.length);
    const longest = byLen[0];
    if (words.length > 1) {
      set.add(words.map(cut).join(' '));
      set.add(longest);
      if (byLen[1].length >= 4) set.add(byLen[1]);
    }
    if (longest.length >= 5) set.add(cut(longest));
    if (words.length >= 3) set.add(words.slice(0, 2).join(' '));
  }
  return [...set].filter((x) => x && x.length >= 3).slice(0, 7);
}

async function smartSearch(type, rawQuery, env) {
  const isMovie = type === 'movie';
  const path = isMovie ? '/search/movie' : '/search/tv';

  // Ano no fim da busca: "matrix 1999"
  let q = rawQuery.trim();
  let yearParam = {};
  const ym = q.match(/\b(19\d{2}|20\d{2})\b\s*$/);
  if (ym && q.length > ym[0].length) {
    yearParam = isMovie ? { primary_release_year: ym[1] } : { first_air_date_year: ym[1] };
    q = q.slice(0, ym.index).trim();
  }

  const pool = new Map(); // id -> { pt, en }

  const run = async (query, language) => {
    try {
      const d = await tmdb(path, env, { query, language, include_adult: 'false', ...yearParam });
      for (const x of d.results || []) {
        const e = pool.get(x.id) || {};
        e[language === 'en-US' ? 'en' : 'pt'] = x;
        pool.set(x.id, e);
      }
    } catch (e) {
      // ignora falhas pontuais
    }
  };

  const nq = normalize(q);

  const titlesOf = (e) => {
    const t = [];
    for (const x of [e.pt, e.en]) {
      if (!x) continue;
      t.push(isMovie ? x.title : x.name, isMovie ? x.original_title : x.original_name);
    }
    return t.map(normalize).filter(Boolean);
  };

  const scoreOf = (e) => {
    let best = 0;
    for (const t of titlesOf(e)) best = Math.max(best, sim(nq, t));
    const pop = (e.pt || e.en).popularity || 0;
    return { best, final: best + Math.min(0.1, Math.log10(pop + 1) / 30) };
  };

  // 1) Busca direta, em português e em inglês ao mesmo tempo.
  await Promise.all([run(q, 'pt-BR'), run(q, 'en-US')]);

  // 2) Se o resultado parece fraco, tenta variações.
  const strong = [...pool.values()].filter((e) => scoreOf(e).best >= 0.85).length;
  if (strong < 3) {
    const variants = queryVariants(q).filter((v) => v !== q);
    await Promise.all(variants.flatMap((v) => [run(v, 'pt-BR'), run(v, 'en-US')]));
  }

  let ranked = [...pool.entries()]
    .map(([id, e]) => ({ id, e, ...scoreOf(e) }))
    .sort((a, b) => b.final - a.final);

  const good = ranked.filter((r) => r.best >= 0.4);
  ranked = (good.length >= 5 ? good : ranked).slice(0, 30);

  return ranked.map(({ e }) => {
    const pt = e.pt || e.en;
    const en = e.en || e.pt;
    const item = toCatalogItem(type, pt);
    if (!item.description) item.description = en.overview || undefined;
    if (!item.poster) item.poster = img(en.poster_path, 'w500');
    if (!item.background) item.background = img(en.backdrop_path, 'w1280');
    return item;
  });
}

// ---------- Catálogos (Busca e Descobrir) ----------

function toCatalogItem(type, x) {
  const isMovie = type === 'movie';
  const date = isMovie ? x.release_date : x.first_air_date;
  return {
    id: `tmdb:${x.id}`,
    type,
    name: isMovie ? x.title : x.name,
    poster: img(x.poster_path, 'w500'),
    background: img(x.backdrop_path, 'w1280'),
    description: x.overview || undefined,
    releaseInfo: date ? date.slice(0, 4) : undefined,
    imdbRating: x.vote_average ? x.vote_average.toFixed(1) : undefined,
  };
}

async function buildCatalog(type, catalogId, extra, env) {
  const isMovie = type === 'movie';
  const skip = parseInt(extra.get('skip') || '0', 10) || 0;
  const page = Math.floor(skip / PAGE_SIZE) + 1;

  if (catalogId.startsWith('busca-')) {
    const q = (extra.get('search') || '').trim();
    if (!q || skip > 0) return [];
    return smartSearch(type, q, env);
  }

  const genres = isMovie ? MOVIE_GENRES : TV_GENRES;
  const genreName = extra.get('genre');
  const params = { page, include_adult: 'false' };
  if (genreName && genreName !== ALL && genres[genreName]) params.with_genres = genres[genreName];

  if (catalogId.endsWith('-populares')) {
    params.sort_by = 'popularity.desc';
  } else if (catalogId.endsWith('-melhores')) {
    params.sort_by = 'vote_average.desc';
    params['vote_count.gte'] = 300;
  } else if (catalogId.endsWith('-lancamentos')) {
    params.sort_by = isMovie ? 'primary_release_date.desc' : 'first_air_date.desc';
    params[isMovie ? 'primary_release_date.lte' : 'first_air_date.lte'] = today();
    params['vote_count.gte'] = 10;
  } else {
    return [];
  }

  const data = await tmdb(isMovie ? '/discover/movie' : '/discover/tv', env, params);
  return (data.results || []).map((x) => toCatalogItem(type, x));
}

// ---------- Detalhes (meta) ----------

async function resolveTmdbId(type, rawId, env) {
  if (rawId.startsWith('tmdb:')) return rawId.slice(5).split(':')[0];
  if (rawId.startsWith('tt')) {
    const f = await tmdb('/find/' + rawId.split(':')[0], env, { external_source: 'imdb_id' });
    const hit = (type === 'movie' ? f.movie_results : f.tv_results)[0];
    return hit ? String(hit.id) : null;
  }
  return null;
}

async function buildMovie(id, tmdbId, env) {
  const d = await tmdb(`/movie/${tmdbId}`, env, { append_to_response: 'credits,external_ids' });
  const crew = (d.credits && d.credits.crew) || [];
  const cast = (d.credits && d.credits.cast) || [];
  return {
    id,
    type: 'movie',
    name: d.title,
    poster: img(d.poster_path, 'w500'),
    background: img(d.backdrop_path, 'w1280'),
    description: d.overview || undefined,
    releaseInfo: d.release_date ? d.release_date.slice(0, 4) : undefined,
    released: iso(d.release_date),
    runtime: d.runtime ? `${d.runtime} min` : undefined,
    genres: (d.genres || []).map((g) => g.name),
    imdbRating: d.vote_average ? d.vote_average.toFixed(1) : undefined,
    imdb_id: d.external_ids && d.external_ids.imdb_id ? d.external_ids.imdb_id : undefined,
    cast: cast.slice(0, 10).map((c) => c.name),
    director: crew.filter((c) => c.job === 'Director').map((c) => c.name),
  };
}

async function buildSeries(id, tmdbId, env) {
  const d = await tmdb(`/tv/${tmdbId}`, env, { append_to_response: 'credits,external_ids' });
  const seasonNumbers = (d.seasons || []).map((s) => s.season_number).filter((n) => n > 0);

  const chunks = [];
  for (let i = 0; i < seasonNumbers.length; i += 20) chunks.push(seasonNumbers.slice(i, i + 20));

  const bulk = await Promise.all(
    chunks.map((c) =>
      tmdb(`/tv/${tmdbId}`, env, { append_to_response: c.map((n) => `season/${n}`).join(',') }).catch(() => null)
    )
  );

  const seasons = bulk.flatMap((r, i) => (r ? chunks[i].map((n) => r[`season/${n}`]).filter(Boolean) : []));

  const videos = [];
  for (const s of seasons) {
    if (!s) continue;
    for (const e of s.episodes || []) {
      videos.push({
        id: `${id}:${e.season_number}:${e.episode_number}`,
        title: e.name || `Episódio ${e.episode_number}`,
        season: e.season_number,
        episode: e.episode_number,
        released: iso(e.air_date) || new Date(0).toISOString(),
        overview: e.overview || undefined,
        thumbnail: img(e.still_path, 'w300'),
      });
    }
  }

  const cast = (d.credits && d.credits.cast) || [];
  return {
    id,
    type: 'series',
    name: d.name,
    poster: img(d.poster_path, 'w500'),
    background: img(d.backdrop_path, 'w1280'),
    description: d.overview || undefined,
    releaseInfo: d.first_air_date ? d.first_air_date.slice(0, 4) : undefined,
    released: iso(d.first_air_date),
    runtime: d.episode_run_time && d.episode_run_time[0] ? `${d.episode_run_time[0]} min` : undefined,
    genres: (d.genres || []).map((g) => g.name),
    imdbRating: d.vote_average ? d.vote_average.toFixed(1) : undefined,
    imdb_id: d.external_ids && d.external_ids.imdb_id ? d.external_ids.imdb_id : undefined,
    cast: cast.slice(0, 10).map((c) => c.name),
    videos,
  };
}

async function metaFromOrigin(url) {
  const res = await fetch(`${ORIGIN}${url.pathname}${url.search}`);
  return new Response(res.body, { status: res.status, headers: JSON_HEADERS });
}

// ---------- Imagem de foco por aparelho ----------
// /f?u=<imagem de foco>&c=<imagem de capa>
// - Celular (User-Agent "ktor-client"): redireciona para a CAPA.
// - TV e PC: o Worker entrega a imagem de foco com Cache-Control longo (30 dias).
// Só aceita links do raw.githubusercontent.com.

const F_HOSTS = new Set(['raw.githubusercontent.com']);
const F_TYPES = { gif: 'image/gif', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const F_TTL = 30 * 24 * 3600;

async function focusRoute(url, request) {
  const u = url.searchParams.get('u');
  const c = url.searchParams.get('c');
  const ok = (s) => {
    try {
      const x = new URL(s);
      return x.protocol === 'https:' && F_HOSTS.has(x.hostname);
    } catch (e) {
      return false;
    }
  };
  const redirect = (to) =>
    new Response(null, { status: 302, headers: { ...CORS, Location: to, 'Cache-Control': 'no-store' } });

  if (!ok(u)) return new Response('Parametro u invalido', { status: 400, headers: CORS });

  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (ua.includes('ktor-client') && ok(c)) return redirect(c);

  try {
    const up = await fetch(u, { cf: { cacheEverything: true, cacheTtl: F_TTL } });
    if (up.ok) {
      const ext = u.split('?')[0].split('.').pop().toLowerCase();
      const h = new Headers(CORS);
      h.set('Content-Type', F_TYPES[ext] || up.headers.get('content-type') || 'application/octet-stream');
      h.set('Cache-Control', `private, max-age=${F_TTL}, immutable`);
      return new Response(request.method === 'HEAD' ? null : up.body, { status: 200, headers: h });
    }
  } catch (e) {
    // cai no redirecionamento
  }
  return redirect(u);
}

// ---------- Collection pronto para o Nuvio ----------
// O collection-template.json tem o marcador {{WORKER_URL}} no lugar do endereço do Worker.
// Aqui o marcador é trocado pelo endereço de quem está hospedando.
const WORKER_URL_MARKER = '{{WORKER_URL}}';

async function collectionRoute(url, request, env) {
  const tpl = String(env.COLLECTION_TEMPLATE_URL || COLLECTION_TEMPLATE_URL || '').trim();
  const FRIENDLY = 'Não consegui preparar o collection agora. Tente de novo em alguns minutos.';
  const fail = (status, detail) => {
    if (detail) console.log('collection:', detail);
    return new Response(FRIENDLY, { status, headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  };
  if (!tpl || tpl.includes('SEU-USUARIO')) return fail(503, 'COLLECTION_TEMPLATE_URL não configurada.');
  let target;
  try { target = new URL(tpl); } catch { return fail(503, 'COLLECTION_TEMPLATE_URL inválida.'); }
  if (target.protocol !== 'https:') return fail(503, 'COLLECTION_TEMPLATE_URL precisa ser HTTPS.');
  try {
    const up = await fetch(target.toString(), { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!up.ok) return fail(502, 'Modelo respondeu HTTP ' + up.status + '.');
    const text = await up.text();
    if (!text.includes(WORKER_URL_MARKER)) return fail(502, 'Arquivo sem o marcador do Worker.');
    const out = text.split(WORKER_URL_MARKER).join(url.origin);
    return new Response(request.method === 'HEAD' ? null : out, {
      headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store', 'Content-Disposition': 'inline; filename="sintonize-collection.json"' },
    });
  } catch (e) {
    return fail(502, 'Falha ao baixar o modelo.');
  }
}

// ---------- Página de status (/) ----------
// ---------- Aviso de atualização ----------

function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

// Lê o version.json do GitHub no máximo a cada 6 horas (usa o KV quando existe).
// Se o GitHub estiver fora do ar, devolve null e o painel simplesmente não mostra aviso.
async function latestVersionInfo(env, ctx) {
  try {
    return await cached(env, ctx, 'sintonize:version:v1', 6 * 3600, async () => {
      const response = await fetch(VERSION_URL, { headers: { Accept: 'application/json' } });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data || typeof data.version !== 'string' || !/^\d+(\.\d+)*$/.test(data.version)) return null;
      return {
        version: data.version,
        descricao: String(data.descricao || '').slice(0, 300),
        download: String(data.download || '').slice(0, 300),
      };
    });
  } catch (e) {
    return null;
  }
}

function homePage(env, origin) {
  const logo = logoUrl(env);
  const row = (label, ok) => `<li><span class="${ok ? 'ok' : 'no'}">${ok ? 'Pronto' : 'Faltando'}</span> ${label}</li>`;
  const all = !!(env.TMDB_API_KEY && env.ADMIN_PASSWORD && env.CACHE);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sintonize</title><style>
:root{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090909;color:#f4f4f4;font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
main{width:min(520px,calc(100% - 32px));padding:28px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(255,255,255,.05)}
img{width:52px;height:52px;border-radius:14px;object-fit:cover;filter:grayscale(1)}h1{margin:14px 0 4px;font-size:22px}p{color:#aaa;margin:0 0 18px}
ul{list-style:none;padding:0;margin:0 0 20px;display:grid;gap:8px}li span{display:inline-block;min-width:68px;padding:2px 9px;margin-right:8px;border-radius:99px;border:1px solid rgba(255,255,255,.2);font-size:12px;text-align:center}
.ok{color:#c9f2d8}.no{color:#ffc9c9}a{color:#fff}code{background:rgba(255,255,255,.08);padding:2px 6px;border-radius:6px;word-break:break-all}small{display:block;margin-top:18px;color:#777}
</style></head><body><main><img src="${logo}" alt=""><h1>Sintonize</h1><p>${all ? 'Seu Worker está configurado.' : 'Falta configurar alguma coisa na Cloudflare.'}</p><ul>
${row('Secret TMDB_API_KEY', !!env.TMDB_API_KEY)}${row('Secret ADMIN_PASSWORD', !!env.ADMIN_PASSWORD)}${row('KV com o nome CACHE', !!env.CACHE)}</ul>
<p>Painel: <a href="/admin">${origin}/admin</a><br>Manifesto para o Nuvio: <code>${origin}/manifest.json</code></p>
<small>Base de collection feita por <a href="${KAPTAIN_URL}" target="_blank" rel="noopener noreferrer">Kaptain</a>. Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</small></main></body></html>`;
}

// ============================================================================
// AGREGADOR DE ADDONS EXTERNOS
// ============================================================================
// A lista começa vazia: cada pessoa adiciona os próprios addons pelo painel (/admin).
const DEFAULT_ADDON_MANIFESTS = [];
const ADDON_CONFIG_KEY = 'sintonize:admin:addons:v1';

async function readAddonConfig(env, includeDisabled = false) {
  if (env.CACHE) {
    try {
      const value = await env.CACHE.get(ADDON_CONFIG_KEY, 'json');
      if (Array.isArray(value)) return value.filter((x) => x && typeof x.url === 'string' && (includeDisabled || x.enabled !== false));
    } catch { /* usa configuração padrão se o KV estiver indisponível */ }
  }
  return includeDisabled ? DEFAULT_ADDON_MANIFESTS : DEFAULT_ADDON_MANIFESTS.filter((x) => x.enabled !== false);
}

function adminPage(env) {
const logo = logoUrl(env);
return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#090909"><title>Sintonize — Painel</title><style>
:root{color-scheme:dark;--bg:#090909;--surface:rgba(255,255,255,.055);--surface2:rgba(255,255,255,.085);--line:rgba(255,255,255,.12);--line2:rgba(255,255,255,.2);--text:#f6f6f6;--muted:#999;--subtle:#6f6f6f;--white:#fff;--good:#c9f2d8;--bad:#ffc9c9;--radius:18px;--font:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box}html{background:var(--bg);scroll-behavior:smooth}body{margin:0;min-height:100vh;color:var(--text);font-family:var(--font);font-size:14px;line-height:1.5;letter-spacing:.005em;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;background:radial-gradient(ellipse at 78% -18%,rgba(255,255,255,.1),transparent 38%),radial-gradient(ellipse at -10% 60%,rgba(255,255,255,.035),transparent 35%),#090909}button,input,select{font:inherit}button{color:inherit}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid white;outline-offset:2px}.login{width:min(440px,calc(100% - 32px));margin:11vh auto;padding:28px}.glass{background:linear-gradient(145deg,rgba(255,255,255,.085),rgba(255,255,255,.035));border:1px solid var(--line);box-shadow:0 22px 70px rgba(0,0,0,.36),inset 0 1px rgba(255,255,255,.06);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-radius:var(--radius)}.loginmark{display:flex;align-items:center;gap:14px;margin-bottom:22px}.loginmark img,.brand img{width:46px;height:46px;object-fit:cover;border-radius:14px;border:1px solid var(--line2);filter:grayscale(1)}.loginmark strong,.brand strong{display:block;font-size:19px;letter-spacing:.02em}.loginmark span,.brand span{font-size:12px;color:var(--muted)}.login h1{font-size:24px;letter-spacing:-.04em;margin:0 0 7px}.login p{color:var(--muted);margin:0 0 22px}.fieldlabel{display:block;color:#ccc;font-size:12px;margin:0 0 8px}.textinput{width:100%;height:46px;padding:0 14px;border-radius:11px;background:rgba(0,0,0,.44);border:1px solid var(--line2);color:var(--text);margin-bottom:12px}.shell{display:grid;grid-template-columns:248px minmax(0,1fr);min-height:100vh}.sidebar{height:100vh;position:sticky;top:0;padding:22px 14px;border-right:1px solid var(--line);background:rgba(8,8,8,.73);backdrop-filter:blur(22px);display:flex;flex-direction:column;z-index:5}.brand{display:flex;align-items:center;gap:12px;padding:5px 9px 27px}.brand strong{font-size:18px}.navlabel{padding:0 11px 9px;text-transform:uppercase;letter-spacing:.15em;font-size:10px;color:#686868}.nav{display:grid;gap:5px}.navbtn{height:43px;display:flex;align-items:center;gap:12px;padding:0 12px;border:1px solid transparent;background:transparent;color:#a6a6a6;border-radius:11px;text-align:left;cursor:pointer;transition:.18s ease}.navbtn svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.7;flex:none}.navbtn:hover{background:rgba(255,255,255,.055);color:#fff}.navbtn.active{background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.11);color:#fff;box-shadow:inset 0 1px rgba(255,255,255,.08)}.sidebottom{margin-top:auto;border-top:1px solid var(--line);padding:15px 8px 3px;color:#777;font-size:11px}.connection{display:flex;align-items:center;gap:8px;color:#bbb;margin-bottom:8px}.dot{width:7px;height:7px;background:#f4f4f4;border-radius:50%;box-shadow:0 0 12px #fff}.main{width:100%;max-width:1500px;margin:0 auto;padding:32px clamp(20px,4vw,58px) 60px}.topbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:28px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:#777;margin-bottom:5px}.topbar h1{font-size:clamp(24px,3vw,32px);line-height:1.15;letter-spacing:-.045em;margin:0}.topbar p{font-size:13px;color:var(--muted);margin:7px 0 0}.topactions{display:flex;align-items:center;gap:9px}.userpill{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--surface);padding:7px 11px;border-radius:99px;color:#bbb;font-size:12px}.userpill svg{width:15px;height:15px;stroke:#ddd;fill:none}.btn{min-height:39px;padding:0 14px;border:1px solid var(--line2);border-radius:10px;background:rgba(255,255,255,.07);color:#eee;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:background .16s,border-color .16s,transform .16s;font-weight:550}.btn:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.32);transform:translateY(-1px)}.btn.primary{color:#111;background:#f3f3f3;border-color:#fff}.btn.primary:hover{background:#fff}.btn.ghost{background:transparent}.btn.danger{color:#f0caca;border-color:rgba(255,255,255,.19)}.btn.small{min-height:32px;padding:0 10px;font-size:12px}.btn.full{width:100%}.pages{display:block}.page{display:none;animation:fade .22s ease}.page.active{display:block}@keyframes fade{from{opacity:.35;transform:translateY(4px)}to{opacity:1;transform:none}}.gridstats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-bottom:16px}.stat{padding:19px 20px;min-height:126px;position:relative;overflow:hidden}.stat:after{content:"";position:absolute;right:-28px;top:-36px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.04);filter:blur(3px)}.statlabel{color:#999;font-size:12px}.statvalue{font-size:30px;font-weight:620;letter-spacing:-.06em;margin:10px 0 3px}.statnote{font-size:11px;color:#777}.staticon{position:absolute;top:17px;right:18px;color:#777}.staticon svg{width:18px;height:18px;stroke:currentColor;fill:none}.contentgrid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.8fr);gap:14px}.panel{padding:21px;margin-bottom:14px;min-width:0}.panelhead{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:17px}.panelhead h2,.panel h2{font-size:16px;letter-spacing:-.025em;margin:0}.panelhead p,.paneldesc{color:var(--muted);font-size:12px;margin:5px 0 0;line-height:1.55}.micro{font-size:11px;color:#777}.listrows{display:grid}.listrow{display:flex;align-items:center;gap:11px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.07)}.listrow:last-child{border-bottom:0}.rowname{font-weight:550}.rowmeta{font-size:11px;color:#777;margin-top:2px}.rowright{margin-left:auto;text-align:right;color:#999;font-size:11px}.statebadge{border:1px solid var(--line);border-radius:99px;padding:4px 8px;color:#ccc;font-size:10px;white-space:nowrap}.statebadge.off{color:#777}.statebadge.good{color:#e7e7e7;border-color:rgba(255,255,255,.28)}.hint{padding:13px 15px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.035);border-radius:12px;color:#aaa;font-size:12px;line-height:1.55}.chips{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.chip{border:1px solid var(--line);background:rgba(255,255,255,.055);color:#ccc;border-radius:99px;padding:5px 9px;font-size:11px}.sectiontitle{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:24px 0 13px}.sectiontitle h2{margin:0;font-size:17px;letter-spacing:-.03em}.sectiontitle p{margin:5px 0 0;font-size:12px;color:#888}.addonform{display:grid;grid-template-columns:minmax(200px,1fr) auto;gap:10px;align-items:end}.addonform .fieldlabel{grid-column:1/-1;margin:0 0 -4px}.addonform input{margin:0}.toolbar{display:flex;gap:8px;flex-wrap:wrap}.searchrow{display:grid;grid-template-columns:minmax(180px,1fr) 170px 170px;gap:9px;margin:15px 0}.select,.search{height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.35);color:#eee;min-width:0}.search::placeholder,.textinput::placeholder{color:#666}.addonlist{display:grid;gap:10px}.addoncard{padding:17px 18px;border:1px solid var(--line);background:rgba(255,255,255,.035);border-radius:14px;transition:.18s}.addoncard:hover{border-color:rgba(255,255,255,.23);background:rgba(255,255,255,.05)}.addonmain{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px}.dragmark{color:#666;font-size:16px}.addonname{font-weight:600;letter-spacing:-.015em}.addonurl{font-size:11px;color:#777;overflow-wrap:anywhere;margin-top:3px}.addonactions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.iconbtn{width:33px;height:33px;border:1px solid var(--line);background:rgba(255,255,255,.035);border-radius:9px;color:#aaa;cursor:pointer}.iconbtn:hover{color:#fff;background:rgba(255,255,255,.12)}.toggle{position:relative;width:39px;height:22px;flex:none}.toggle input{position:absolute;opacity:0;width:1px;height:1px}.toggle span{display:block;position:absolute;inset:0;border-radius:99px;background:#383838;border:1px solid #555;cursor:pointer;transition:.2s}.toggle span:after{content:"";position:absolute;width:14px;height:14px;top:3px;left:3px;border-radius:50%;background:#aaa;transition:.2s}.toggle input:checked+span{background:#eee;border-color:#fff}.toggle input:checked+span:after{left:20px;background:#111}.catalogbox{margin:15px 0 0 34px;padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(0,0,0,.19)}.cataloghead{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;font-size:12px;color:#aaa}.cataloggrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.catalogitem{display:flex;align-items:center;gap:9px;padding:8px 9px;border:1px solid rgba(255,255,255,.075);border-radius:9px;background:rgba(255,255,255,.025);min-width:0}.catalogitem span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#bbb}.check{appearance:none;width:16px;height:16px;flex:none;border:1px solid #666;border-radius:5px;background:transparent;cursor:pointer;position:relative}.check:checked{background:#eee;border-color:#fff}.check:checked:after{content:"✓";position:absolute;color:#111;font-size:12px;font-weight:800;left:2px;top:-1px}.choicegrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.choice{display:flex;align-items:center;gap:9px;padding:11px 12px;border:1px solid var(--line);background:rgba(255,255,255,.025);border-radius:11px;cursor:pointer;min-height:43px}.choice:hover{background:rgba(255,255,255,.06)}.choice span{font-size:12px;color:#ccc}.choice small{margin-left:auto;color:#696969;font-size:10px}.setgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.profilegrid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.profile{border:1px solid var(--line);border-radius:12px;padding:13px;background:rgba(255,255,255,.025);cursor:pointer;text-align:left;color:#aaa;min-height:88px}.profile strong{display:block;color:#eee;font-size:12px;margin-bottom:5px}.profile.active{border-color:#eee;background:rgba(255,255,255,.11);box-shadow:inset 0 1px rgba(255,255,255,.1)}.rangehint{color:#777;font-size:11px;margin-top:7px}.footactions{display:flex;justify-content:flex-end;gap:9px;margin:15px 0}.tablewrap{overflow:auto}.table{width:100%;border-collapse:collapse;font-size:12px}.table th,.table td{text-align:left;padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:top}.table th{color:#777;font-weight:550}.status{font-size:12px;min-height:20px;color:#ddd;margin:10px 0}.status.error{color:var(--bad)}.status.success{color:var(--good)}.modal{position:fixed;inset:0;z-index:10;background:rgba(0,0,0,.74);backdrop-filter:blur(9px);display:none;place-items:center;padding:18px}.modal.show{display:grid}.modalbox{max-width:560px;width:100%;padding:23px;background:rgba(20,20,20,.94);border:1px solid var(--line2);box-shadow:0 30px 90px #000b;border-radius:18px}.modalhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}.modalhead h2{margin:0;font-size:18px}.hide{display:none!important}.mobilebrand{display:none}.loading{color:#888;text-align:center;padding:30px}.table td:first-child{color:#eee}.quiet{color:#777}.templatehead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:15px}.templatehead h2{margin:0;font-size:16px}.templatecode{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;max-height:390px;overflow:auto;padding:16px;border:1px solid rgba(255,255,255,.13);border-radius:12px;background:rgba(0,0,0,.46);color:#e5e5e5;font:12px/1.75 ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;tab-size:2;user-select:text}.templatefoot{display:flex;justify-content:space-between;gap:12px;margin-top:9px}.divider{height:1px;background:var(--line);margin:17px 0}
@media(max-width:1050px){.gridstats{grid-template-columns:repeat(2,1fr)}.contentgrid{grid-template-columns:1fr}.profilegrid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.shell{display:block}.sidebar{height:auto;position:sticky;top:0;padding:9px 12px 10px;border-right:0;border-bottom:1px solid var(--line);background:rgba(8,8,8,.9)}.brand{display:none}.navlabel,.sidebottom{display:none}.nav{display:flex;overflow:auto;scrollbar-width:none;gap:5px}.nav::-webkit-scrollbar{display:none}.navbtn{height:38px;white-space:nowrap;padding:0 11px;font-size:12px}.navbtn svg{width:15px}.main{padding:21px 15px 45px}.topbar{margin-bottom:18px}.userpill{display:none}.searchrow{grid-template-columns:1fr 1fr}.searchrow .search{grid-column:1/-1}.addonmain{grid-template-columns:auto minmax(0,1fr)}.addonactions{grid-column:1/-1;justify-content:flex-start;margin-left:27px}.catalogbox{margin-left:0}.setgrid{grid-template-columns:1fr}.choicegrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.gridstats{gap:8px}.stat{min-height:105px;padding:14px}.statvalue{font-size:25px}.statnote{font-size:10px}.panel{padding:16px}.addonform{grid-template-columns:1fr}.addonform .fieldlabel{grid-column:auto}.addonform button{width:100%}.searchrow{grid-template-columns:1fr}.searchrow .search{grid-column:auto}.cataloggrid{grid-template-columns:1fr}.profilegrid{grid-template-columns:1fr 1fr}.sectiontitle{align-items:flex-start;flex-direction:column}.topactions .btn{min-height:35px;padding:0 10px}.choicegrid{grid-template-columns:1fr 1fr}.userpill{display:none}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
.formatterpresets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:17px}.formatterpreset{padding:14px;text-align:left;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.03);color:#ddd;cursor:pointer;transition:.18s}.formatterpreset:hover{background:rgba(255,255,255,.08);border-color:var(--line2)}.formatterpreset.active{background:rgba(255,255,255,.12);border-color:#ddd;box-shadow:inset 0 1px rgba(255,255,255,.12)}.formatterpreset b{display:block;font-size:13px;margin-bottom:5px}.formatterpreset small{font-size:11px;color:#999;line-height:1.45}.importrow{display:grid;grid-template-columns:auto minmax(180px,1fr) auto;gap:9px;align-items:center;margin-top:12px}.importrow .search{width:100%}.publicurl{display:block;overflow:auto;white-space:nowrap;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.3);color:#ddd;font:12px ui-monospace,SFMono-Regular,Consolas,monospace}.templatehead h3{margin:0;font-size:14px}.templatecode{min-height:90px}.templatecode:empty:before{content:"Nenhum template carregado";color:#777}@media(max-width:760px){#page-templates .panelhead{flex-direction:column;align-items:flex-start}#page-templates .panelhead>div{width:100%;min-width:0}#page-templates .panelhead>.statebadge{align-self:flex-start;width:auto}#page-templates .panelhead .toolbar{display:flex;flex-wrap:wrap;gap:8px}#page-templates .templatecode{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;line-height:1.65;max-height:280px;overflow:auto}.formatterpresets{grid-template-columns:1fr}.importrow{grid-template-columns:1fr}.importrow .btn{width:100%}}
.toasts{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);display:grid;gap:10px;z-index:50;pointer-events:none;width:min(420px,calc(100% - 28px))}
.toast{display:flex;align-items:center;gap:14px;padding:15px 18px;border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.26);box-shadow:0 24px 70px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.18);backdrop-filter:blur(26px) saturate(150%);-webkit-backdrop-filter:blur(26px) saturate(150%);opacity:0;transform:translateY(18px) scale(.96);transition:opacity .32s ease,transform .32s cubic-bezier(.2,.9,.3,1.2)}
.toast.show{opacity:1;transform:none}
.toast i{width:34px;height:34px;border-radius:50%;flex:none;background:#f3f3f3;position:relative;box-shadow:0 0 22px rgba(255,255,255,.35)}
.toast i:after{content:"✓";position:absolute;inset:0;display:grid;place-items:center;color:#111;font-style:normal;font-weight:800;font-size:17px}
.toast.error i{background:#ffc9c9;box-shadow:0 0 22px rgba(255,150,150,.4)}.toast.error i:after{content:"!"}
.toast b{display:block;font-size:14px;letter-spacing:-.01em}.toast span{display:block;font-size:12px;color:#c4c4c4;margin-top:2px}
#saveAll{position:relative;gap:9px}
#saveAll .savedot{width:8px;height:8px;border-radius:50%;background:#aaa;transition:.2s}
#saveAll.dirty{box-shadow:0 0 0 0 rgba(255,255,255,.5);animation:pulse 1.8s infinite}
#saveAll.dirty .savedot{background:#e0a100;box-shadow:0 0 10px #e0a100}
@keyframes pulse{70%{box-shadow:0 0 0 10px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}
.glass{transition:border-color .2s,transform .2s}.stat:hover,.addoncard:hover{transform:translateY(-2px)}
.navbtn.active{position:relative}.navbtn.active:before{content:"";position:absolute;left:-14px;top:10px;bottom:10px;width:3px;border-radius:3px;background:#fff}
.addoncard{border-left:3px solid rgba(255,255,255,.28)}
.dragmark{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;padding:10px 8px;margin:-10px -8px;border-radius:8px;color:#777;font-size:18px;line-height:1}.dragmark:hover{color:#fff;background:rgba(255,255,255,.08)}.dragmark:active{cursor:grabbing}
.addoncard.dragging{transition:none!important;z-index:20;position:relative;box-shadow:0 26px 70px rgba(0,0,0,.65);border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.1);cursor:grabbing}
.manualbox{margin:15px 0 0 34px;padding:16px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.04)}.manualsec{margin-top:16px}.manualsec>b{display:block;font-size:12px;margin-bottom:4px;color:#ddd}.manualsec>.rangehint{margin:0 0 9px;line-height:1.5}.manualbtns{display:flex;gap:8px;flex-wrap:wrap}.manualgroup{margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}.manualgroup>h3{margin:0;font-size:14px;letter-spacing:-.01em}
.switchlabel{display:inline-flex;align-items:center;gap:9px;padding:0 8px 0 2px;min-height:32px;font-size:12px;color:#ccc;cursor:pointer;font-weight:550}
.addonurl{display:flex;align-items:center;gap:8px}.urltext{overflow-wrap:anywhere;letter-spacing:.04em}.eyebtn{width:26px;height:26px;flex:none;display:inline-grid;place-items:center;border:1px solid var(--line);background:rgba(255,255,255,.035);border-radius:8px;color:#aaa;cursor:pointer;padding:0}.eyebtn:hover{color:#fff;background:rgba(255,255,255,.12)}
.fsrow{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}.fsrow label{display:grid;gap:6px;font-size:12px;color:#bbb;min-width:0}.fsrow .search{width:160px}.fsrow .select{min-width:240px}
.panel .rangehint{line-height:1.5}
.partners{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.partner{display:block;padding:15px 16px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.03);color:#ddd;text-decoration:none;transition:.18s}.partner:hover{background:rgba(255,255,255,.08);border-color:var(--line2)}.partner b{display:block;font-size:14px;margin-bottom:4px;color:#fff}.partner small{display:block;font-size:11px;color:#9a9a9a;line-height:1.5}.partner .go{display:inline-block;margin-top:9px;font-size:12px;color:#fff;text-decoration:underline;text-underline-offset:3px}
.credit{font-size:11px;color:#777;margin-top:8px;line-height:1.5}.credit a,.panel a.plain{color:#fff}.stepslist{margin:0;padding-left:18px;color:#bbb;font-size:12px;line-height:1.8}
@media(max-width:600px){.partners{grid-template-columns:1fr}}
</style></head><body>
<section id="login" class="login glass"><div class="loginmark"><img src="${logo}" alt="Sintonize"><div><strong>SINTONIZE</strong><span>Central de administração</span></div></div><h1>Seu painel, em um só lugar.</h1><p>Entre com a senha administrativa do Worker para gerenciar addons e fontes.</p><label class="fieldlabel" for="password">Senha do administrador</label><input id="password" class="textinput" type="password" autocomplete="current-password" placeholder="Digite sua senha"><button class="btn primary full" id="loginBtn">Entrar no painel <span aria-hidden="true">→</span></button><div id="loginStatus" class="status"></div></section>
<div id="updateBanner" style="display:none;position:sticky;top:0;z-index:50;padding:10px 16px;background:#1d1a0f;color:#ffe9a8;border-bottom:1px solid #554a1c;font:14px/1.5 system-ui,sans-serif"></div><div id="app" class="shell hide"><aside class="sidebar"><div class="brand"><img src="${logo}" alt=""><div><strong>SINTONIZE</strong><span>ADMIN CONSOLE</span></div></div><div class="navlabel">Workspace</div><nav class="nav"><button class="navbtn active" data-tab="home"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="11" width="7" height="10" rx="2"/><rect x="3" y="14" width="8" height="7" rx="2"/></svg>Visão geral</button><button class="navbtn" data-tab="addons"><svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h7"/></svg>Addons</button><button class="navbtn" data-tab="quality"><svg viewBox="0 0 24 24"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 6h4"/></svg>Qualidade</button><button class="navbtn" data-tab="languages"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>Idiomas</button><button class="navbtn" data-tab="templates"><svg viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>Apresentação</button><button class="navbtn" data-tab="collection"><svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 14h6M9 17h4"/></svg>Collection</button><button class="navbtn" data-tab="backup"><svg viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>Backup & ferramentas</button></nav><div class="sidebottom"><div class="connection"><i class="dot"></i>Worker conectado</div>As preferências são salvas no KV do Cloudflare.<div class="credit">Base de collection feita por <a href="${KAPTAIN_URL}" target="_blank" rel="noopener noreferrer">Kaptain</a></div></div></aside><main class="main"><header class="topbar"><div><div class="eyebrow">Sintonize / <span id="crumb">Visão geral</span></div><h1 id="pageTitle">Visão geral</h1><p id="pageDesc">Acompanhe e organize suas fontes em um só lugar.</p></div><div class="topactions"><span class="userpill"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>Administrador</span><button class="btn primary" id="saveAll"><span class="savedot"></span><span id="saveAllLabel">Salvar tudo</span></button><button class="btn ghost" id="logout">Sair</button></div></header>
<div id="page-home" class="page active"><div class="gridstats"><article class="glass stat"><span class="staticon"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></span><div class="statlabel">Addons ativos</div><div class="statvalue" id="statActive">0</div><div class="statnote">Fontes no agregador</div></article><article class="glass stat"><span class="staticon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6"/></svg></span><div class="statlabel">Addons cadastrados</div><div class="statvalue" id="statTotal">0</div><div class="statnote">Ativos e pausados</div></article><article class="glass stat"><span class="staticon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3z"/></svg></span><div class="statlabel">Catálogos verificados</div><div class="statvalue" id="statCatalogs">—</div><div class="statnote">Dos testes desta sessão</div></article><article class="glass stat"><span class="staticon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><div class="statlabel">Conexões testadas</div><div class="statvalue" id="statTests">—</div><div class="statnote" id="testHint">Teste addons para conferir</div></article></div><div class="contentgrid"><section class="glass panel"><div class="panelhead"><div><h2>Seus addons</h2><p>Visão rápida do que está conectado.</p></div><button class="btn small" data-goto="addons">Gerenciar →</button></div><div id="healthList" class="listrows"></div></section><section class="glass panel"><div class="panelhead"><div><h2>Preferências rápidas</h2><p>O que acontece com rótulos de baixa qualidade.</p></div></div><div id="quickRules" class="chips"></div><div class="hint" id="quickMode"></div><div style="margin-top:14px"><button class="btn small" data-goto="quality">Ajustar preferências</button></div></section></div><div class="hint">A lista pode priorizar ou ocultar fontes pelo rótulo. A reprodução automática da próxima fonte após uma falha ainda depende do player Nuvio.</div></div>
<div id="page-addons" class="page"><section class="glass panel"><div class="panelhead"><div><h2>Parceiros recomendados</h2><p>Addons de fontes que recomendamos. Os dois são gratuitos e não usam TorBox. Abra o site, copie o seu link de manifesto e cole em “Conectar um addon”, logo abaixo.</p></div></div><div class="partners"><a class="partner" href="https://froststream.cloutteam.com/" target="_blank" rel="noopener noreferrer"><b>FrostStream</b><small>Gratuito. Não usa TorBox.</small><span class="go">Abrir site</span></a><a class="partner" href="https://fenixflix.fenixhub.online/" target="_blank" rel="noopener noreferrer"><b>FenixFlix</b><small>Gratuito. Não usa TorBox.</small><span class="go">Abrir site</span></a></div></section><section class="glass panel"><div class="panelhead"><div><h2>Conectar um addon</h2><p>Adicione o endereço do manifesto. O nome e os catálogos serão detectados automaticamente.</p></div><span class="statebadge">HTTPS</span></div><div class="addonform"><label class="fieldlabel" for="newAddonUrl">Endereço do addon</label><input id="newAddonUrl" class="textinput" type="url" placeholder="https://addon.exemplo/manifest.json" autocomplete="url"><button class="btn primary" id="addAddon">Validar e adicionar <span>→</span></button></div><div id="addStatus" class="status"></div></section><div class="sectiontitle"><div><h2>Minha biblioteca</h2><p>Ative, teste, reordene ou ajuste catálogos sem editar código.</p></div><div class="toolbar"><button class="btn small" id="testAll">Testar todos</button><button class="btn small primary" id="saveAddons">Salvar alterações</button></div></div><div class="searchrow"><input id="addonSearch" class="search" placeholder="Buscar addon"><select id="addonFilter" class="select"><option value="all">Todos os estados</option><option value="on">Ativos</option><option value="off">Pausados</option></select><select id="addonSort" class="select"><option value="order">Ordem manual</option><option value="name">Nome A–Z</option><option value="status">Status</option></select></div><div id="addonsList" class="addonlist"></div><div id="addonStatus" class="status"></div></div>
<div id="page-quality" class="page"></div><div id="page-languages" class="page"></div>
<div id="page-templates" class="page"><section class="glass panel"><div class="panelhead"><div><h2>Formatação das fontes</h2><p>Escolha um preset, importe um formatter AIOStreams ou exporte o formato atual em JSON.</p></div><span id="activeFormatterLabel" class="statebadge good">Sintonize Pro</span></div><div class="hint">O arquivo segue o formato de formatter usado pelo AIOStreams: <code>name</code>, <code>description</code> e <code>_label</code>. Isso é diferente de um backup completo da configuração do AIOStreams.</div><div id="formatterPresetGrid" class="formatterpresets"></div></section><section class="glass panel"><div class="panelhead"><div><h2>Importar formatação</h2><p>Importe um arquivo JSON salvo no seu dispositivo ou carregue um JSON por URL HTTPS.</p></div></div><div class="importrow"><label class="btn">Importar arquivo JSON<input id="formatterFile" type="file" accept=".json,application/json" hidden></label><input id="formatterUrl" class="search" type="url" placeholder="https://.../formatter.json" autocomplete="url"><button class="btn" id="importFormatterUrl">Carregar URL</button></div><div id="formatterStatus" class="status" aria-live="polite"></div></section><section class="glass panel"><div class="panelhead"><div><h2>Formato selecionado</h2><p id="formatterSubtitle">Use os botões para copiar os dois campos ou exportar o pacote completo.</p></div><div class="toolbar"><button class="btn small" id="copyFormatterName">Copiar Name</button><button class="btn small" id="copyFormatterDescription">Copiar Description</button></div></div><div class="templatehead"><div><h3>Name Template</h3><p class="paneldesc">Linha principal do resultado.</p></div></div><pre id="formatterNameText" class="templatecode" tabindex="0"></pre><div class="templatehead" style="margin-top:18px"><div><h3>Description Template</h3><p class="paneldesc">Metadados apresentados abaixo do nome.</p></div></div><pre id="formatterDescriptionText" class="templatecode" tabindex="0"></pre><div class="footactions"><button class="btn primary" id="exportFormatter">Exportar formatter JSON</button></div></section><section class="glass panel"><div class="panelhead"><div><h2>Importação direta no AIOStreams</h2><p>O Worker pode publicar o formatter atual num endpoint JSON para o importador do AIOStreams buscar.</p></div></div><div class="importrow"><code id="formatterPublicUrl" class="publicurl"></code><button class="btn" id="copyFormatterUrl">Copiar URL de importação</button></div><div class="rangehint">Depois, no AIOStreams, abra Formatter → Import e cole essa URL. Só os campos de formatação ficam públicos; a senha administrativa e a configuração dos addons não são incluídas.</div></section></div>
<div id="page-collection" class="page"><section class="glass panel"><div class="panelhead"><div><h2>Collection para o Nuvio</h2><p>Gera o arquivo de collection já apontando para este Worker. Você não precisa editar nenhum endereço.</p></div></div><ol class="stepslist"><li>Clique em “Baixar collection pronto”. O arquivo sintonize-collection.json vai para a sua pasta de downloads.</li><li>No Nuvio, importe o arquivo baixado.</li><li>As imagens de foco passam a ser entregues pelo seu Worker.</li></ol><div class="toolbar" style="margin-top:16px"><button class="btn primary" id="dlCollection">Baixar collection pronto</button></div><div id="collectionStatus" class="status" aria-live="polite"></div><div class="rangehint">Endereço do seu Worker usado no arquivo: <code id="collectionOrigin"></code></div></section><section class="glass panel"><div class="panelhead"><div><h2>Créditos</h2></div></div><p class="paneldesc" style="margin-top:0">Base de collection feita por <a class="plain" href="${KAPTAIN_URL}" target="_blank" rel="noopener noreferrer">Kaptain</a>. Mantenha este crédito se você compartilhar o collection.</p><p class="paneldesc">Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p></section></div>
<div id="page-backup" class="page"><section class="glass panel"><div class="panelhead"><div><h2>Backup e manutenção</h2><p>Guarde ou restaure a configuração do Sintonize.</p></div></div><div class="toolbar"><button class="btn" id="exportConfig">Exportar backup JSON</button><label class="btn">Importar backup<input id="importConfig" type="file" accept="application/json" hidden></label><button class="btn" id="downloadManifest">Ver manifesto do Sintonize</button></div><div id="backupStatus" class="status"></div></section><section class="glass panel"><div class="panelhead"><div><h2>Armazenamento</h2><p>As configurações usam o namespace KV vinculado ao Worker como <code>CACHE</code>.</p></div></div><div class="hint">Para manter a tela administrativa rápida e segura, a senha é verificada pelo Worker e a sessão fica somente neste navegador. Não compartilhe sua sessão.</div></section></div>
</main></div><div id="toasts" class="toasts" aria-live="polite"></div><div id="modal" class="modal"><div class="modalbox"><div class="modalhead"><h2 id="modalTitle">Addon</h2><button class="iconbtn" id="closeModal" aria-label="Fechar">×</button></div><div id="modalBody"></div></div></div>
<script id="formatterPresetData" type="application/json">${JSON.stringify(SINTONIZE_FORMATTER_PRESETS)}</script><script>
const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];let token=sessionStorage.getItem('sintonizeAdmin')||'',state={addons:[],preferences:{},tests:{}};const suggested=['CAM','CAMRip','HDCAM','TS','HDTS','Telesync','TC','SD','480p'];const pageInfo={home:['Visão geral','Acompanhe e organize suas fontes em um só lugar.'],addons:['Addons','Conecte e controle seus addons.'],quality:['Qualidade','Resolução, origem, codec, HDR, tamanho e ordem das fontes.'],languages:['Idiomas','Áudio e legendas das fontes.'],templates:['Apresentação','Defina como as fontes serão identificadas no player.'],collection:['Collection','Gere o collection do Nuvio já apontando para o seu Worker.'],backup:['Backup & ferramentas','Exporte, restaure e confira o manifesto.']};function auth(){return {Authorization:'Bearer '+token,'Content-Type':'application/json'}}function csv(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean)}function say(sel,text,kind){let el=$(sel);if(!el)return;el.textContent=text||'';el.className='status'+(kind?' '+kind:'')}function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function go(tab){$$('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+tab));$$('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));$('#pageTitle').textContent=pageInfo[tab][0];$('#pageDesc').textContent=pageInfo[tab][1];$('#crumb').textContent=pageInfo[tab][0];window.scrollTo({top:0,behavior:'smooth'})}$$('.navbtn').forEach(b=>b.onclick=()=>go(b.dataset.tab));$$('[data-goto]').forEach(b=>b.onclick=()=>go(b.dataset.goto));async function api(url,opts){let r=await fetch(url,Object.assign({},opts||{},{headers:Object.assign({},auth(),(opts&&opts.headers)||{})}));if(!r.ok)throw Error((await r.text())||'A solicitação falhou.');return r.json()}async function boot(){const saved=await api('/admin/api');state=Object.assign({tests:{}},saved);$('#login').classList.add('hide');$('#app').classList.remove('hide');renderAll()}$('#loginBtn').onclick=async()=>{token=$('#password').value;try{await boot();sessionStorage.setItem('sintonizeAdmin',token)}catch(e){say('#loginStatus',e.message,'error')}};$('#password').onkeydown=e=>{if(e.key==='Enter')$('#loginBtn').click()};if(token)boot().catch(()=>{sessionStorage.removeItem('sintonizeAdmin');token=''})
function renderAll(){renderAddons();renderChoices();renderDashboard();renderFormatter()}function renderDashboard(){const a=state.addons;$('#statTotal').textContent=a.length;$('#statActive').textContent=a.filter(x=>x.enabled!==false).length;let tested=Object.keys(state.tests);$('#statTests').textContent=tested.length?tested.length:'—';$('#testHint').textContent=tested.length?'manifestos testados nesta sessão':'Teste addons para conferir';$('#statCatalogs').textContent=Object.values(state.tests).reduce((n,x)=>n+(x.catalogs||[]).length,0)||'—';$('#healthList').innerHTML=a.length?a.map((x,i)=>'<div class="listrow"><span class="statebadge '+(x.enabled===false?'off':'good')+'">'+(x.enabled===false?'Pausado':'Ativo')+'</span><div><div class="rowname">'+esc(x.name||'Addon '+(i+1))+'</div><div class="rowmeta">'+(state.tests[x.url]?(state.tests[x.url].ok?'Manifesto válido':'Falha no teste'):'Ainda não testado')+'</div></div><span class="rowright">'+((state.tests[x.url]&&state.tests[x.url].catalogs.length)||'—')+' catálogos</span></div>').join(''):'<div class="loading">Adicione seu primeiro addon para começar.</div>';const terms=gcfg().excludeTerms||[];$('#quickRules').innerHTML=terms.map(t=>'<span class="chip">'+esc(t)+'</span>').join('');$('#quickMode').textContent=gcfg().hideBlocked?'Os rótulos selecionados estão ocultos da lista.':'Os rótulos selecionados continuam disponíveis, mas são rebaixados.'}
const ui={open:{},show:{},qprof:'',lprof:''};
const EYE='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYEOFF='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 6.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4.1-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
function chevron(open){return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+(open?'M6 15l6-6 6 6':'M6 9l6 6 6-6')+'"/></svg>'}
function renderAddons(){var q=$('#addonSearch').value.toLowerCase(),f=$('#addonFilter').value,sort=$('#addonSort').value;var list=state.addons.map(function(x,i){return Object.assign({_index:i},x)}).filter(function(x){return(!q||((x.name||'')+' '+x.url).toLowerCase().includes(q))&&(f==='all'||(f==='on'?x.enabled!==false:x.enabled===false))});if(sort==='name')list.sort(function(a,b){return(a.name||'').localeCompare(b.name||'')});if(sort==='status')list.sort(function(a,b){return Number(b.enabled!==false)-Number(a.enabled!==false)});
$('#addonsList').innerHTML=list.length?list.map(addonMarkup).join(''):'<section class="glass panel"><div class="loading">Nenhum addon encontrado. Adicione um endereço de manifesto acima.</div></section>';
$$('[data-addon-toggle]').forEach(function(el){el.onchange=function(){state.addons[+el.dataset.addonToggle].enabled=el.checked;renderAll()}});
$$('[data-addon-test]').forEach(function(el){el.onclick=function(){testAddon(+el.dataset.addonTest)}});
$$('[data-addon-edit]').forEach(function(el){el.onclick=function(){openEdit(+el.dataset.addonEdit)}});
$$('[data-addon-eye]').forEach(function(el){el.onclick=function(){var a=state.addons[+el.dataset.addonEye];ui.show[a.url]=!ui.show[a.url];renderAddons()}});
$$('[data-addon-delete]').forEach(function(el){el.onclick=function(){if(confirm('Remover este addon do Sintonize?')){state.addons.splice(+el.dataset.addonDelete,1);renderAll()}}});
$$('[data-addon-catalog]').forEach(function(el){el.onchange=function(){var a=state.addons[+el.dataset.addonIndex],id=el.dataset.addonCatalog;a.disabledCatalogs=a.disabledCatalogs||[];a.disabledCatalogs=el.checked?a.disabledCatalogs.filter(function(x){return x!==id}):Array.from(new Set(a.disabledCatalogs.concat(id)));say('#addonStatus','Catálogos atualizados. Clique em Salvar tudo para gravar.','success')}});
$$('[data-addon-all-cats]').forEach(function(el){el.onclick=function(){var i=+el.dataset.addonAllCats,a=state.addons[i],cats=(state.tests[a.url]&&state.tests[a.url].catalogs)||[];a.disabledCatalogs=el.dataset.mode==='show'?[]:cats.map(function(c){return c.id});renderAddons()}});
$$('[data-man-toggle]').forEach(function(el){el.onchange=function(){var a=state.addons[+el.dataset.manToggle];ensureManual(a);a.manual.enabled=el.checked;if(el.checked)ui.open[a.url]=true;renderAddons();renderDashboard()}});
$$('[data-man-fold]').forEach(function(el){el.onclick=function(){var a=state.addons[+el.dataset.manFold];ui.open[a.url]=!ui.open[a.url];renderAddons()}});
$$('[data-man-reset]').forEach(function(el){el.onclick=function(){var a=state.addons[+el.dataset.manReset];a.manual=Object.assign(defaultFilter(),{enabled:true});renderAddons()}});
$$('[data-man-preset]').forEach(function(el){el.onclick=function(){var a=state.addons[+el.dataset.i],p=el.dataset.manPreset;ensureManual(a);if(p==='ptonly')a.manual.allowLang=['dublado','dual'];else if(p==='nomulti')a.manual.allowLang=['dublado','dual','ingles','nd'];else{a.manual.allowLang=[];a.manual.allowRes=[];a.manual.allowSource=[];a.manual.allowCodec=[]}renderAddons()}});
enableDrag()}
function addonMarkup(a){var i=a._index,man=a.manual&&a.manual.enabled,open=ui.open[a.url]===true,shown=!!ui.show[a.url],test=state.tests[a.url],catHtml='';
if(test&&test.ok){var cats=test.catalogs||[];catHtml='<div class="catalogbox"><div class="cataloghead"><span>Catálogos · '+cats.length+'</span><span class="toolbar"><button class="btn small" data-addon-all-cats="'+i+'" data-mode="show">Mostrar todos</button><button class="btn small" data-addon-all-cats="'+i+'" data-mode="hide">Ocultar todos</button></span></div><div class="cataloggrid">'+(cats.length?cats.map(function(c){return '<label class="catalogitem"><input class="check" type="checkbox" data-addon-catalog="'+esc(c.id)+'" data-addon-index="'+i+'" '+((a.disabledCatalogs||[]).includes(c.id)?'':'checked')+'><span>'+esc(c.name)+' · '+esc(c.type)+'</span></label>'}).join(''):'<span class="micro">Este addon não anuncia catálogos.</span>')+'</div></div>'}
var status=test?(test.ok?'Manifesto verificado':'Falha ao consultar manifesto'):'Verifique o manifesto para listar os catálogos';
var urlLine='<div class="addonurl"><span class="urltext">'+(shown?esc(a.url):'••••••••••••••••••••••••')+'</span><button class="eyebtn" data-addon-eye="'+i+'" title="'+(shown?'Ocultar endereço':'Mostrar endereço')+'" aria-label="'+(shown?'Ocultar endereço':'Mostrar endereço')+'">'+(shown?EYEOFF:EYE)+'</button></div>';
var manHtml=man&&open?manPanel(a,i):'';
return '<article class="glass addoncard"><div class="addonmain"><span class="dragmark" title="Segure e arraste para reordenar">⋮⋮</span><div><div class="addonname">'+esc(a.name||'Addon sem nome')+' <span class="statebadge '+(a.enabled===false?'off':'good')+'">'+(a.enabled===false?'Pausado':'Ativo')+'</span>'+(man?' <span class="statebadge good">Manual</span>':'')+'</div>'+urlLine+'</div><label class="toggle" title="Ativar ou pausar addon"><input type="checkbox" data-addon-toggle="'+i+'" '+(a.enabled===false?'':'checked')+'><span></span></label></div>'
+'<div class="addonactions"><label class="switchlabel" title="Usar filtros próprios neste addon"><span class="toggle"><input type="checkbox" data-man-toggle="'+i+'" '+(man?'checked':'')+'><span></span></span><span>Configuração manual</span></label>'
+(man?'<button class="iconbtn" data-man-fold="'+i+'" title="'+(open?'Recolher configuração':'Expandir configuração')+'" aria-label="'+(open?'Recolher configuração':'Expandir configuração')+'" aria-expanded="'+(open?'true':'false')+'">'+chevron(open)+'</button>':'')
+'<button class="btn small" data-addon-edit="'+i+'">Editar</button><button class="btn small" data-addon-test="'+i+'">'+(test?'Testar novamente':'Testar e carregar catálogos')+'</button><button class="btn small danger" data-addon-delete="'+i+'">Remover</button></div>'
+'<div class="rowmeta" style="margin:8px 0 0 29px">'+status+(test&&test.error?' · '+esc(test.error):'')+'</div>'+manHtml+catHtml+'</article>'}
function manPanel(a,i){ensureManual(a);var m=a.manual;return '<div class="manualbox"><div class="cataloghead"><span>Configuração manual deste addon. As abas Qualidade e Idiomas não valem para ele.</span><button class="btn small" data-man-reset="'+i+'">Restaurar padrão</button></div>'
+'<div class="manualsec"><b>Atalhos</b><div class="manualbtns"><button class="btn small" data-man-preset="ptonly" data-i="'+i+'">Só português (dublado e dual)</button><button class="btn small" data-man-preset="nomulti" data-i="'+i+'">Tirar Multi</button><button class="btn small" data-man-preset="all" data-i="'+i+'">Liberar tudo</button></div></div>'
+'<div class="manualgroup"><h3>Idiomas</h3>'+filterLang(i,m,true)+'</div><div class="manualgroup"><h3>Qualidade</h3>'+filterQuality(i,m,true)+'</div></div>'}
function openEdit(i){var a=state.addons[i];$('#modalTitle').textContent='Editar fonte';
$('#modalBody').innerHTML='<label class="fieldlabel" for="editName">Nome exibido</label><input id="editName" class="textinput" value="'+esc(a.name||'')+'" placeholder="Nome da fonte"><label class="fieldlabel" for="editUrl">Endereço do manifesto</label><input id="editUrl" class="textinput" type="url" value="'+esc(a.url)+'" autocomplete="off"><div class="hint">Trocar só o nome é sempre seguro. Trocar o endereço mantém a configuração manual, os catálogos e a posição na lista, mas muda o identificador interno da fonte: itens que o Nuvio já tinha guardado desse addon podem precisar ser abertos de novo.</div><div id="editStatus" class="status"></div><div class="footactions"><button class="btn" id="editCancel">Cancelar</button><button class="btn primary" id="editSave">Validar e salvar</button></div>';
$('#modal').classList.add('show');
$('#editCancel').onclick=function(){$('#modal').classList.remove('show')};
$('#editSave').onclick=async function(){var btn=this,name=$('#editName').value.trim(),url=$('#editUrl').value.trim(),old={url:a.url,name:a.name};
if(!url){say('#editStatus','Informe o endereço do manifesto.','error');return}
btn.disabled=true;btn.textContent='Validando…';
try{if(url!==a.url){var r=await api('/admin/api/test',{method:'POST',body:JSON.stringify({url:url})});if(state.addons.some(function(x,j){return j!==i&&x.url===url}))throw Error('Este endereço já está na sua biblioteca.');r.ok=true;delete state.tests[a.url];state.tests[url]=r;a.url=url;if(!name)name=r.name||'Addon'}
a.name=name||a.name||'Addon';await persist();$('#modal').classList.remove('show');renderAll();say('#addonStatus','Fonte atualizada.','success')}
catch(e){a.url=old.url;a.name=old.name;say('#editStatus',e.message,'error')}
finally{btn.disabled=false;btn.textContent='Validar e salvar'}}}
function enableDrag(){
$$('.dragmark').forEach(function(h){
h.onpointerdown=function(e){
if(e.button!==undefined&&e.button!==0)return;
if($('#addonSort').value!=='order'||$('#addonSearch').value||$('#addonFilter').value!=='all'){say('#addonStatus','Para arrastar, deixe em Ordem manual, sem busca e sem filtro.','error');return}
e.preventDefault();
var card=h.closest('.addoncard'),cards=$$('.addoncard'),from=cards.indexOf(card);
if(from<0)return;
var rects=cards.map(function(c){return c.getBoundingClientRect()}),startY=e.clientY,to=from,ch=rects[from].height+10;
card.classList.add('dragging');
try{h.setPointerCapture(e.pointerId)}catch(err){}
h.onpointermove=function(ev){
var dy=ev.clientY-startY;
card.style.transform='translateY('+dy+'px)';
var center=rects[from].top+rects[from].height/2+dy,n=0;
rects.forEach(function(r,j){if(j!==from&&r.top+r.height/2<center)n++});
to=n;
cards.forEach(function(c,j){if(j===from)return;var s=0;if(from<to&&j>from&&j<=to)s=-ch;if(from>to&&j>=to&&j<from)s=ch;c.style.transform='translateY('+s+'px)'});
};
var finish=function(ev){
h.onpointermove=null;h.onpointerup=null;h.onpointercancel=null;
try{h.releasePointerCapture(e.pointerId)}catch(err){}
cards.forEach(function(c){c.style.transform='';c.classList.remove('dragging')});
if(ev&&ev.type==='pointerup'&&to!==from){var m=state.addons.splice(from,1)[0];state.addons.splice(to,0,m);renderAll()}
};
h.onpointerup=finish;h.onpointercancel=finish;
};
});
}

async function testAddon(i){let a=state.addons[i];say('#addonStatus','Testando '+(a.name||a.url)+'…');try{let result=await api('/admin/api/test',{method:'POST',body:JSON.stringify({url:a.url})});result.ok=true;state.tests[a.url]=result;if(!a.name||a.name==='Addon')a.name=result.name||a.name;renderAll();say('#addonStatus','Conexão validada: '+result.name+' · '+result.catalogs.length+' catálogos.','success')}catch(e){state.tests[a.url]={ok:false,error:e.message,catalogs:[]};renderAll();say('#addonStatus','Não foi possível validar: '+e.message,'error')}}function moveAddon(i,delta){let j=i+delta;if(j<0||j>=state.addons.length)return;[state.addons[i],state.addons[j]]=[state.addons[j],state.addons[i]];renderAll()}$('#addonSearch').oninput=renderAddons;$('#addonFilter').onchange=renderAddons;$('#addonSort').onchange=renderAddons;$('#addAddon').onclick=async()=>{let input=$('#newAddonUrl'),url=input.value.trim();if(!url){say('#addStatus','Cole o endereço HTTPS do manifesto.','error');input.focus();return}let btn=$('#addAddon');btn.disabled=true;btn.textContent='Validando…';try{let result=await api('/admin/api/test',{method:'POST',body:JSON.stringify({url})});let addon={url:url,name:result.name||'Addon',enabled:true,languages:[],qualities:[],disabledCatalogs:[],catalogNames:{}};if(state.addons.some(x=>x.url===url))throw Error('Este endereço já está na sua biblioteca.');state.addons.push(addon);result.ok=true;state.tests[url]=result;await persist();input.value='';renderAll();say('#addStatus','Addon conectado: '+result.name+' · '+result.catalogs.length+' catálogos.','success')}catch(e){say('#addStatus',e.message,'error')}finally{btn.disabled=false;btn.innerHTML='Validar e adicionar <span>→</span>'}};async function persist(){return api('/admin/api',{method:'PUT',body:JSON.stringify({addons:state.addons,preferences:state.preferences})})}$('#saveAddons').onclick=async()=>{try{await persist();say('#addonStatus','Alterações salvas com sucesso.','success')}catch(e){say('#addonStatus',e.message,'error')}};$('#testAll').onclick=async()=>{for(let i=0;i<state.addons.length;i++)await testAddon(i)}
const OPT={
lang:[['dublado','Dublado PT-BR'],['dual','Dual (PT-BR + original)'],['multi','Multi-áudio'],['ingles','Inglês'],['nd','Idioma não indicado']],
res:[['4K','4K / 2160p'],['1080p','1080p'],['720p','720p'],['sd','SD (576p ou 480p)'],['nd','Não indicada']],
src:[['remux','Remux'],['bluray','BluRay / BDRip'],['webdl','WEB-DL'],['webrip','WEBRip'],['hdtv','HDTV'],['outro','Outras (DVDRip, HDRip…)'],['nd','Não indicada']],
codec:[['h265','H.265 / HEVC'],['h264','H.264 / AVC'],['av1','AV1'],['nd','Não indicado']],
block:[['CAM','CAM'],['CAMRip','CAMRip'],['HDCAM','HDCAM'],['TS','TS'],['HDTS','HDTS'],['Telesync','Telesync'],['TC','TC / Telecine'],['SD','SD'],['480p','480p'],['Screener','Screener'],['Workprint','Workprint']],
hdr:[['any','Tanto faz'],['prefer','Preferir com HDR / Dolby Vision'],['only','Só com HDR / Dolby Vision'],['hide','Esconder HDR / Dolby Vision']],
subs:[['any','Tanto faz'],['prefer','Preferir fontes com legenda'],['only','Só fontes com legenda']],
first:[['auto','Automático'],['dublado','Dublado PT-BR'],['dual','Dual'],['multi','Multi-áudio'],['ingles','Inglês']],
sort:[['smart','Inteligente: prontas primeiro, depois a melhor resolução'],['res','Melhor resolução primeiro'],['size_desc','Maior arquivo primeiro'],['size_asc','Menor arquivo primeiro']],
kwLang:[['pt-BR','Português · Brasil'],['pt','Português'],['en','Inglês'],['es','Espanhol'],['ja','Japonês'],['fr','Francês'],['it','Italiano'],['de','Alemão'],['dub','Dublado'],['leg','Legendado']],
kwQual:[['2160p','2160p / 4K'],['1080p','1080p'],['720p','720p'],['576p','576p'],['480p','480p / SD'],['WEB-DL','WEB-DL'],['BluRay','BluRay'],['Remux','Remux'],['WEBRip','WEBRip'],['HDTV','HDTV']]};
const QPROF={balanced:{label:'Equilibrado',desc:'Mostra tudo; prontas e melhor resolução primeiro.',cfg:{allowRes:[],allowSource:[],allowCodec:[],hdr:'any',minGB:0,maxGB:0,sortBy:'smart'},q:['1080p','WEB-DL','BluRay','720p']},
high:{label:'Alta qualidade',desc:'Só 4K e 1080p, HDR preferido.',cfg:{allowRes:['4K','1080p'],allowSource:[],allowCodec:[],hdr:'prefer',minGB:0,maxGB:0,sortBy:'res'},q:['2160p','4K','1080p','Remux','BluRay','WEB-DL']},
economy:{label:'Internet limitada',desc:'Arquivos de até 4 GB, os menores primeiro.',cfg:{allowRes:['1080p','720p','sd'],allowSource:[],allowCodec:[],hdr:'any',minGB:0,maxGB:4,sortBy:'size_asc'},q:['720p','1080p','480p']},
k4:{label:'4K / cinema',desc:'Só 4K, com HDR preferido.',cfg:{allowRes:['4K'],allowSource:[],allowCodec:[],hdr:'prefer',minGB:0,maxGB:0,sortBy:'res'},q:['2160p','4K','Remux','BluRay','1080p']}};
const LPROF={ptfirst:{label:'PT-BR primeiro',desc:'Mostra tudo; dublado aparece antes.',cfg:{allowLang:[],langFirst:'dublado',subs:'any'},l:['pt-BR','pt','dub','leg']},
ptonly:{label:'Só português',desc:'Esconde tudo que não for dublado ou dual.',cfg:{allowLang:['dublado','dual'],langFirst:'auto',subs:'any'},l:['pt-BR','pt','dub']},
original:{label:'Original com legenda',desc:'Inglês e fontes legendadas primeiro.',cfg:{allowLang:[],langFirst:'ingles',subs:'prefer'},l:['en','leg']},
any:{label:'Qualquer idioma',desc:'Sem filtro nem prioridade de idioma.',cfg:{allowLang:[],langFirst:'auto',subs:'any'},l:[]}};
function defaultFilter(){return {allowLang:[],allowRes:[],allowSource:[],allowCodec:[],excludeTerms:suggested.slice(),hideBlocked:false,onlyReady:false,hideDownload:false,hdr:'any',subs:'any',langFirst:'auto',minGB:0,maxGB:0,maxPerAddon:0,sortBy:'smart'}}
function gcfg(){state.preferences.filter=Object.assign(defaultFilter(),state.preferences.filter||{});return state.preferences.filter}
function ensureManual(a){a.manual=Object.assign(defaultFilter(),a.manual||{})}
function cfgOf(scope){if(scope==='g')return gcfg();var a=state.addons[+scope];ensureManual(a);return a.manual}
function fsChecks(scope,key,items,sel,type){return '<div class="choicegrid">'+items.map(function(it){return '<label class="choice"><input class="check" type="checkbox" data-fs="'+scope+'" data-fk="'+key+'" data-ft="'+(type||'list')+'" value="'+esc(it[0])+'" '+((sel||[]).indexOf(it[0])>=0?'checked':'')+'><span>'+esc(it[1])+'</span></label>'}).join('')+'</div>'}
function fsBool(scope,key,label,val){return '<label class="choice"><input class="check" type="checkbox" data-fs="'+scope+'" data-fk="'+key+'" data-ft="bool" '+(val?'checked':'')+'><span>'+esc(label)+'</span></label>'}
function fsSel(scope,key,items,val){return '<select class="select" data-fs="'+scope+'" data-fk="'+key+'" data-ft="sel">'+items.map(function(it){return '<option value="'+esc(it[0])+'" '+(it[0]===val?'selected':'')+'>'+esc(it[1])+'</option>'}).join('')+'</select>'}
function fsNum(scope,key,val,step){return '<input class="search" type="number" min="0" step="'+(step||1)+'" data-fs="'+scope+'" data-fk="'+key+'" data-ft="num" value="'+(val>0?val:'')+'" placeholder="0">'}
function fsBlock(title,desc,body,compact){return compact?'<div class="manualsec"><b>'+title+'</b><p class="rangehint">'+desc+'</p>'+body+'</div>':'<section class="glass panel"><div class="panelhead"><div><h2>'+title+'</h2><p>'+desc+'</p></div></div>'+body+'</section>'}
function filterLang(s,c,compact){var b=function(t,d,body){return fsBlock(t,d,body,compact)};
return b('Idiomas de áudio permitidos','Desmarque os idiomas que você não quer ver. Sem nenhuma caixa marcada, o filtro fica desligado. O idioma é lido do nome e da descrição da fonte; quando a fonte não diz nada, ela cai em Idioma não indicado.',fsChecks(s,'allowLang',OPT.lang,c.allowLang))
+b('Idioma que aparece primeiro','Não esconde nada: só coloca esse idioma no topo da lista de cada addon.',fsSel(s,'langFirst',OPT.first,c.langFirst))
+b('Legendas','Fontes com legenda são identificadas por palavras como legendado, legenda ou subs. Dublado costuma não ter legenda, então Só fontes com legenda também esconde dublados.',fsSel(s,'subs',OPT.subs,c.subs))}
function filterQuality(s,c,compact){var b=function(t,d,body){return fsBlock(t,d,body,compact)};
return b('Resoluções permitidas','Marque o que pode aparecer. Sem nenhuma caixa marcada, o filtro fica desligado.',fsChecks(s,'allowRes',OPT.res,c.allowRes))
+b('Origem do vídeo','Remux e BluRay têm a melhor imagem, mas são arquivos grandes. WEB-DL é o equilíbrio. WEBRip e HDTV costumam ser mais leves.',fsChecks(s,'allowSource',OPT.src,c.allowSource))
+b('Codec de vídeo','H.265 gera arquivos menores, mas alguns aparelhos antigos não reproduzem. H.264 é o mais compatível.',fsChecks(s,'allowCodec',OPT.codec,c.allowCodec))
+b('HDR e Dolby Vision','Só use Só com HDR se a sua TV exibe HDR corretamente. Em tela comum, as cores podem ficar lavadas.',fsSel(s,'hdr',OPT.hdr,c.hdr))
+b('Tamanho do arquivo','Use 0 para não limitar. Fontes que não informam o tamanho não são filtradas.','<div class="fsrow"><label>Mínimo (GB)'+fsNum(s,'minGB',c.minGB,0.5)+'</label><label>Máximo (GB)'+fsNum(s,'maxGB',c.maxGB,0.5)+'</label></div>')
+b('Rótulos de baixa qualidade','CAM costuma ser gravação em cinema. TS e HDTS variam bastante. SD e 480p são só baixa resolução, não necessariamente defeituosos.',fsChecks(s,'excludeTerms',OPT.block,c.excludeTerms)+'<div style="margin-top:9px">'+fsBool(s,'hideBlocked','Ocultar por completo os rótulos marcados (desligado: vão para o fim da lista)',c.hideBlocked)+'</div>')
+b('Disponibilidade','Prontas são as que já estão em cache no serviço e começam na hora.','<div class="choicegrid" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+fsBool(s,'onlyReady','Mostrar só o que está pronto para assistir',c.onlyReady)+fsBool(s,'hideDownload','Ocultar fontes que precisam baixar ou esperar',c.hideDownload)+'</div>')
+b('Ordem e tamanho da lista','Define como cada addon ordena as fontes e quantas mostra. Preferências e rótulos rebaixados sempre vêm antes da ordem escolhida. Máximo 0 = mostrar todas.','<div class="fsrow"><label>Ordenar por'+fsSel(s,'sortBy',OPT.sort,c.sortBy)+'</label><label>Máximo por addon'+fsNum(s,'maxPerAddon',c.maxPerAddon,1)+'</label></div>')}
function presetGrid(map,attr,active){return '<section class="glass panel"><div class="panelhead"><div><h2>Atalhos</h2><p>Aplicam valores prontos. Depois você ajusta cada opção abaixo.</p></div></div><div class="profilegrid">'+Object.keys(map).map(function(k){return '<button class="profile '+(active===k?'active':'')+'" data-'+attr+'="'+k+'"><strong>'+esc(map[k].label)+'</strong><span class="micro">'+esc(map[k].desc)+'</span></button>'}).join('')+'</div></section>'}
function renderChoices(){var g=gcfg(),p=state.preferences;
$('#page-quality').innerHTML='<div class="sectiontitle" style="margin-top:0"><div><h2>Qualidade</h2><p>Resolução, origem, codec, HDR, tamanho e ordem das fontes. Vale para todos os addons, menos os que usam configuração manual.</p></div></div>'
+presetGrid(QPROF,'qprof',ui.qprof)+filterQuality('g',g,false)
+fsBlock('Qualidade e origem preferidas','Palavras-chave que sobem na lista quando aparecem no nome da fonte. Não escondem nada.',fsChecks('g','qualities',OPT.kwQual,p.qualities,'plist'),false)
+'<div class="footactions"><button class="btn primary" id="savePrefs">Salvar preferências</button></div><div id="prefsStatus" class="status"></div>';
$('#page-languages').innerHTML='<div class="sectiontitle" style="margin-top:0"><div><h2>Idiomas</h2><p>Áudio e legendas. Vale para todos os addons, menos os que usam configuração manual.</p></div></div>'
+presetGrid(LPROF,'lprof',ui.lprof)+filterLang('g',g,false)
+fsBlock('Idiomas preferidos (palavras-chave)','Palavras que sobem a fonte na lista quando aparecem no nome ou na descrição. Não escondem nada.',fsChecks('g','languages',OPT.kwLang,p.languages,'plist'),false)
+'<div class="footactions"><button class="btn primary" id="savePrefs2">Salvar preferências</button></div><div id="prefsStatus2" class="status"></div>';
$$('[data-qprof]').forEach(function(el){el.onclick=function(){var x=QPROF[el.dataset.qprof];Object.assign(gcfg(),JSON.parse(JSON.stringify(x.cfg)));state.preferences.qualities=x.q.slice();ui.qprof=el.dataset.qprof;renderChoices();renderDashboard();say('#prefsStatus','Atalho aplicado. Clique em Salvar tudo para gravar.','success')}});
$$('[data-lprof]').forEach(function(el){el.onclick=function(){var x=LPROF[el.dataset.lprof];Object.assign(gcfg(),JSON.parse(JSON.stringify(x.cfg)));state.preferences.languages=x.l.slice();ui.lprof=el.dataset.lprof;renderChoices();renderDashboard();say('#prefsStatus2','Atalho aplicado. Clique em Salvar tudo para gravar.','success')}});
['savePrefs','savePrefs2'].forEach(function(id,n){$('#'+id).onclick=async function(){try{await persist();say(n?'#prefsStatus2':'#prefsStatus','Preferências salvas.','success');renderDashboard()}catch(e){say(n?'#prefsStatus2':'#prefsStatus',e.message,'error')}}})}
document.addEventListener('change',function(e){var el=e.target;if(!el.dataset||!el.dataset.fk)return;var t=el.dataset.ft,k=el.dataset.fk;
if(t==='plist'){state.preferences[k]=$$('[data-ft="plist"][data-fk="'+k+'"]:checked').map(function(x){return x.value});renderDashboard();return}
var c=cfgOf(el.dataset.fs);
if(t==='list'){var set=new Set(c[k]||[]);if(el.checked)set.add(el.value);else set.delete(el.value);c[k]=Array.from(set)}
else if(t==='bool')c[k]=el.checked;
else if(t==='sel')c[k]=el.value;
else if(t==='num'){var n=parseFloat(el.value);c[k]=isFinite(n)&&n>0?n:0}
renderDashboard()});
const formatterPresets=JSON.parse($('#formatterPresetData').textContent);
const formatterPresetSummaries={aiostreamsGdrive:'Modelo oficial Google Drive: addon no nome e detalhes de vídeo, áudio, idioma e arquivo na descrição.',aiostreamsLightGdrive:'Versão mais compacta do preset oficial, pensada para leitura rápida em telas pequenas.',sintonizePro:'Layout Sintonize em linhas organizadas: qualidade, vídeo/áudio, tamanho, seeders, idiomas e nome do arquivo.',original:'Visual compacto, com letras pequenas e símbolos, para telas com pouco espaço.'};
function normalizeFormatterData(raw){let x=raw;if(x&&x.formatter&&typeof x.formatter==='object')x=x.formatter;if(x&&x.definitions&&x.definitions.overrides){const all=x.definitions.overrides;const candidate=all.tamtaro||all[Object.keys(all)[0]];if(candidate)x=candidate}if(!x||typeof x.name!=='string'||typeof x.description!=='string')throw Error('JSON incompatível. O formato esperado é um formatter com name e description.');if(!x.name.trim()||!x.description.trim())throw Error('Os campos Name Template e Description Template não podem estar vazios.');if(x.name.length>20000||x.description.length>40000)throw Error('O formatter excede o tamanho máximo permitido.');return {name:x.name,description:x.description,_label:String(x._label||x.label||'Formatter importado').slice(0,120)}}
function currentFormatter(){if(!state.preferences.formatter)state.preferences.formatter=Object.assign({},formatterPresets.sintonizePro);return normalizeFormatterData(state.preferences.formatter)}
function renderFormatter(){const selected=currentFormatter();$('#activeFormatterLabel').textContent=selected._label;$('#formatterNameText').textContent=selected.name;$('#formatterDescriptionText').textContent=selected.description;$('#formatterSubtitle').textContent=selected._label+' · '+selected.name.length+' caracteres no nome e '+selected.description.length+' na descrição';$('#formatterPublicUrl').textContent=new URL('/formatter.json',location.origin).href;$('#formatterPresetGrid').innerHTML=Object.keys(formatterPresets).map(key=>{const preset=formatterPresets[key];return '<button class="formatterpreset '+(selected._label===preset._label?'active':'')+'" type="button" data-formatter-preset="'+esc(key)+'"><b>'+esc(preset._label)+'</b><small>'+esc(formatterPresetSummaries[key]||'Formatter carregado por importação.')+'</small></button>'}).join('');$$('[data-formatter-preset]').forEach(button=>button.onclick=()=>applyFormatter(formatterPresets[button.dataset.formatterPreset]))}
async function persistFormatter(pack,status){state.preferences.formatter=pack;renderFormatter();try{await persist();say('#formatterStatus',status,'success')}catch(error){say('#formatterStatus','O formato foi selecionado, mas não foi possível salvá-lo no KV: '+error.message,'error')}}
async function applyFormatter(raw,label){try{const pack=normalizeFormatterData(raw);await persistFormatter(pack,label||('Formato selecionado: '+pack._label+'.'))}catch(error){say('#formatterStatus',error.message,'error')}}
async function readBoundedResponse(response){const max=500000,declared=Number(response.headers.get('content-length')||0);if(declared>max)throw Error('O JSON excede 500 KB.');if(!response.body||!response.body.getReader){const text=await response.text();if(text.length>max)throw Error('O JSON excede 500 KB.');return text}const reader=response.body.getReader(),chunks=[];let total=0;while(true){const result=await reader.read();if(result.done)break;total+=result.value.byteLength;if(total>max){await reader.cancel();throw Error('O JSON excede 500 KB.')}chunks.push(result.value)}const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}return new TextDecoder().decode(bytes)}
async function importFormatterText(text,sourceLabel){if(text.length>500000)throw Error('O arquivo é grande demais (limite de 500 KB).');const parsed=JSON.parse(text);const pack=normalizeFormatterData(parsed);await applyFormatter(pack,'Formato importado de '+sourceLabel+': '+pack._label+'.')}
$('#formatterFile').onchange=async event=>{const file=event.target.files&&event.target.files[0];if(!file)return;try{if(file.size>500000)throw Error('O arquivo excede 500 KB.');await importFormatterText(await file.text(),file.name)}catch(error){say('#formatterStatus','Não foi possível importar: '+error.message,'error')}event.target.value=''};
$('#importFormatterUrl').onclick=async()=>{const value=$('#formatterUrl').value.trim();let url;try{url=new URL(value)}catch{say('#formatterStatus','Informe a URL HTTPS de um arquivo JSON de formatter.','error');return}if(url.protocol!=='https:'){say('#formatterStatus','Por segurança, a importação por URL aceita somente HTTPS.','error');return}const button=$('#importFormatterUrl');button.disabled=true;button.textContent='Carregando…';try{const response=await fetch(url.href,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('A URL respondeu HTTP '+response.status+'.');const text=await readBoundedResponse(response);await importFormatterText(text,url.hostname)}catch(error){say('#formatterStatus','Não foi possível carregar esse formatter: '+error.message+'. Verifique se o endereço permite acesso direto ao JSON.','error')}finally{button.disabled=false;button.textContent='Carregar URL'}};
$('#exportFormatter').onclick=()=>{try{const pack=currentFormatter(),file={name:pack.name,description:pack.description,_label:pack._label};const blob=new Blob([JSON.stringify(file,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(pack._label||'sintonize-formatter').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);say('#formatterStatus','Formatter exportado no formato JSON do AIOStreams.','success')}catch(error){say('#formatterStatus',error.message,'error')}};
async function copyText(value,label){try{await navigator.clipboard.writeText(value);say('#formatterStatus',label+' copiado.','success')}catch(error){const area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();say('#formatterStatus',ok?label+' copiado.':'Não foi possível copiar automaticamente.',ok?'success':'error')}}
$('#copyFormatterName').onclick=()=>copyText(currentFormatter().name,'Name Template');$('#copyFormatterDescription').onclick=()=>copyText(currentFormatter().description,'Description Template');$('#copyFormatterUrl').onclick=()=>copyText(new URL('/formatter.json',location.origin).href,'URL de importação');
$('#exportConfig').onclick=()=>{let blob=new Blob([JSON.stringify({addons:state.addons,preferences:state.preferences},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sintonize-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};$('#importConfig').onchange=async e=>{try{let file=e.target.files[0],d=JSON.parse(await file.text());if(!Array.isArray(d.addons))throw Error('Arquivo inválido.');state.addons=d.addons;state.preferences=Object.assign(state.preferences,d.preferences||{});await persist();renderAll();say('#backupStatus','Backup restaurado e salvo.','success')}catch(err){say('#backupStatus','Não foi possível importar: '+err.message,'error')}e.target.value=''};$('#downloadManifest').onclick=()=>window.open('/manifest.json','_blank');$('#logout').onclick=()=>{sessionStorage.removeItem('sintonizeAdmin');token='';location.reload()};$('#closeModal').onclick=()=>$('#modal').classList.remove('show');
/* ---- Collection pronto para o Nuvio ---- */
$('#collectionOrigin').textContent=location.origin;
function saveCollectionFile(text){JSON.parse(text);const blob=new Blob([text],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sintonize-collection.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
$('#dlCollection').onclick=async()=>{const btn=$('#dlCollection');btn.disabled=true;say('#collectionStatus','Preparando o collection…');try{const r=await fetch('/collection.json',{cache:'no-store'});if(!r.ok)throw Error(await r.text()||('HTTP '+r.status));saveCollectionFile(await r.text());say('#collectionStatus','Collection baixado. Importe o arquivo no Nuvio.','success')}catch(e){say('#collectionStatus',e.message,'error')}finally{btn.disabled=false}};

/* ---- Salvar tudo + pop-up de vidro ---- */
let saved='';
const snap=()=>JSON.stringify({a:state.addons,p:state.preferences});
function markDirty(v){$('#saveAll').classList.toggle('dirty',v);$('#saveAllLabel').textContent=v?'Salvar tudo (pendente)':'Salvar tudo'}
function toast(msg,kind){const el=document.createElement('div');el.className='toast '+(kind||'success');el.innerHTML='<i></i><div><b>'+(kind==='error'?'Não foi possível salvar':'Salvo com sucesso')+'</b><span>'+esc(msg)+'</span></div>';$('#toasts').appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400)},3200)}
const _renderAll=renderAll;renderAll=function(){_renderAll();if(!saved)saved=snap()};
const _persist=persist;
persist=async function(){try{const r=await _persist();saved=snap();markDirty(false);toast('Todas as alterações foram gravadas no Cloudflare KV.');return r}catch(e){toast(e.message,'error');throw e}};
$('#saveAll').onclick=async()=>{try{await persist()}catch(e){}};
setInterval(()=>{if(saved)markDirty(snap()!==saved)},400);
window.addEventListener('beforeunload',e=>{if(saved&&snap()!==saved){e.preventDefault();e.returnValue=''}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();$('#saveAll').click()}});
;(async function checkUpdate(){try{var r=await fetch('/version-check',{cache:'no-store'});if(!r.ok)return;var d=await r.json();if(!d.updateAvailable)return;var box=document.getElementById('updateBanner');if(!box)return;box.innerHTML='<b>Nova versão do Sintonize disponível: '+esc(d.latest)+'</b> (você está na '+esc(d.current)+'). '+esc(d.descricao)+(d.download?' <a href=\"'+esc(d.download)+'\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#fff\">Ver como atualizar</a>':'');box.style.display='block'}catch(e){}})();
</script></body></html>`;
}

// Configuração de filtros: a mesma estrutura vale para as abas Qualidade/Idiomas (global)
// e para a "Configuração manual" de cada addon. Lista vazia = aquele filtro fica desligado.
function sanitizeFilter(m) {
  m = m && typeof m === 'object' ? m : {};
  const list = (v) => Array.isArray(v) ? v.slice(0, 20).map((x) => String(x).trim().slice(0, 40)).filter(Boolean) : [];
  const num = (v) => { const n = parseFloat(v); return isFinite(n) && n > 0 ? Math.min(n, 500) : 0; };
  const pick = (v, ok, d) => (ok.includes(v) ? v : d);
  return {
    allowLang: list(m.allowLang),
    allowRes: list(m.allowRes),
    allowSource: list(m.allowSource),
    allowCodec: list(m.allowCodec),
    excludeTerms: list(m.excludeTerms),
    hideBlocked: m.hideBlocked === true,
    onlyReady: m.onlyReady === true,
    hideDownload: m.hideDownload === true,
    hdr: pick(m.hdr, ['any', 'prefer', 'only', 'hide'], 'any'),
    subs: pick(m.subs, ['any', 'prefer', 'only'], 'any'),
    langFirst: pick(m.langFirst, ['auto', 'dublado', 'dual', 'multi', 'ingles'], 'auto'),
    minGB: num(m.minGB),
    maxGB: num(m.maxGB),
    maxPerAddon: Math.floor(num(m.maxPerAddon)),
    sortBy: pick(m.sortBy, ['smart', 'res', 'size_desc', 'size_asc'], 'smart'),
  };
}

function sanitizeManual(m) {
  if (!m || typeof m !== 'object') return undefined;
  return { ...sanitizeFilter(m), enabled: m.enabled === true };
}

async function handleAdmin(request, url, env) {
  if (url.pathname === '/admin' || url.pathname === '/admin/') {
    return new Response(adminPage(env), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
  if (!['/admin/api', '/admin/api/test'].includes(url.pathname)) return null;
  const expected = env.ADMIN_PASSWORD;
  const auth = request.headers.get('authorization') || '';
  if (!expected || !safeEqual(auth, `Bearer ${expected}`)) return new Response('Não autorizado', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  if (url.pathname === '/admin/api/test') {
    if (request.method !== 'POST') return new Response('Método não permitido', { status: 405 });
    try {
      const body = await request.json();
      const normalized = normalizeAddonManifestUrl(String(body.url || ''));
      if (!normalized) return Response.json({ ok: false, error: 'Informe uma URL HTTPS válida.' }, { status: 400 });
      const response = await fetch(normalized.manifestUrl, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
      if (!response.ok) return Response.json({ ok: false, error: `Manifest respondeu HTTP ${response.status}.` }, { status: 502 });
      const manifest = await response.json();
      if (!manifest || typeof manifest.id !== 'string' || !Array.isArray(manifest.resources)) return Response.json({ ok: false, error: 'O endereço respondeu, mas o JSON não parece um manifesto Nuvio/Stremio válido.' }, { status: 422 });
      return Response.json({ ok: true, name: manifest.name || manifest.id, id: manifest.id, description: manifest.description || '', resources: normalizeAddonResources(manifest).map(x => x.name), catalogs: (manifest.catalogs || []).map(x => ({ name: x.name || x.id, type: x.type, id: x.id })) });
    } catch (e) { return Response.json({ ok: false, error: e.name === 'TimeoutError' ? 'Tempo limite excedido (9 s).' : 'Não foi possível carregar/interpretar o manifesto.' }, { status: 502 }); }
  }
  if (!env.CACHE) return new Response('O binding CACHE (Cloudflare KV) é necessário para salvar configurações.', { status: 503 });
  if (request.method === 'GET') {
    const addons = await readAddonConfig(env, true);
    const preferences = await readPreferences(env);
    return Response.json({ addons, preferences }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (request.method !== 'PUT') return new Response('Método não permitido', { status: 405, headers: { Allow: 'GET, PUT' } });
  let data;
  try { data = await request.json(); } catch { return new Response('JSON inválido', { status: 400 }); }
  if (!Array.isArray(data.addons) || data.addons.length > 50) return new Response('Lista inválida (máximo 50 addons).', { status: 400 });
  const addons = [];
  for (const item of data.addons) {
    if (!item || typeof item.url !== 'string' || !item.url.trim()) continue;
    let u; try { u = new URL(item.url.trim()); } catch { return new Response('URL inválida.', { status: 400 }); }
    if (u.protocol !== 'https:' || u.username || u.password) return new Response('Use URLs HTTPS sem credenciais.', { status: 400 });
    const url = normalizeAddonManifestUrl(u.toString());
    if (!url) return new Response('Manifest inválido.', { status: 400 });
    const cleanList = (v) => Array.isArray(v) ? v.slice(0, 20).map(x => String(x).trim().slice(0, 40)).filter(Boolean) : [];
    addons.push({ url: url.manifestUrl, name: String(item.name || '').trim().slice(0, 80), enabled: item.enabled !== false, languages: cleanList(item.languages), qualities: cleanList(item.qualities), disabledCatalogs: cleanList(item.disabledCatalogs), catalogNames: item.catalogNames && typeof item.catalogNames === 'object' ? item.catalogNames : {}, manual: sanitizeManual(item.manual) });
  }
  try {
    const p = data.preferences || {};
    const clean = (v) => Array.isArray(v) ? v.slice(0, 20).map(x => String(x).trim().slice(0, 40)).filter(Boolean) : [];
    const formatter = p.formatter ? sanitizeFormatterPack(p.formatter) : (await readPreferences(env)).formatter;
    if (!formatter) return new Response('Formatter inválido: informe name e description, sem exceder os limites.', { status: 400 });
    await env.CACHE.put(ADDON_CONFIG_KEY, JSON.stringify(addons));
    await env.CACHE.put('sintonize:admin:preferences:v1', JSON.stringify({ languages: clean(p.languages), qualities: clean(p.qualities), excludeTerms: sanitizeFilter(p.filter).excludeTerms, hideBlocked: sanitizeFilter(p.filter).hideBlocked, filter: sanitizeFilter(p.filter), templateMode: ['grouped', 'detail', 'minimal'].includes(p.templateMode) ? p.templateMode : 'detail', nameTemplate: String(p.nameTemplate || '{addon} · {quality} · {language}').slice(0, 120), descriptionTemplate: String(p.descriptionTemplate || 'Fonte do addon {addon}. Qualidade: {quality}. Idioma: {language}.').slice(0, 240), formatter }));
    addonManifestMemory.clear();
    return Response.json({ ok: true });
  } catch { return new Response('Não foi possível gravar no KV.', { status: 503 }); }
}

async function readPreferences(env) {
  const defaults = { languages: [], qualities: [], excludeTerms: ['CAM', 'CAMRip', 'HDCAM', 'TS', 'HDTS', 'Telesync', 'TC', 'SD', '480p'], hideBlocked: false, templateMode: 'detail', nameTemplate: '{addon} · {quality} · {language}', descriptionTemplate: 'Fonte do addon {addon}. Qualidade: {quality}. Idioma: {language}.', formatter: DEFAULT_SINTONIZE_FORMATTER };
  try { const saved = await env.CACHE?.get('sintonize:admin:preferences:v1', 'json') || {}; const merged = { ...defaults, ...saved }; merged.formatter = sanitizeFormatterPack(saved.formatter) || DEFAULT_SINTONIZE_FORMATTER; merged.filter = sanitizeFilter(saved.filter || { excludeTerms: merged.excludeTerms, hideBlocked: merged.hideBlocked }); return merged; }
  catch { return { ...defaults, filter: sanitizeFilter({ excludeTerms: defaults.excludeTerms }) }; }
}

const ADDON_MANIFEST_TTL = 15 * 60;
const ADDON_ITEM_PREFIX = 'agg_';
const ADDON_CATALOG_PREFIX = 'ext_';
const ADDON_SUBTITLE_PREFIX = 'asub_';
const addonManifestMemory = new Map();

function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ID estável por URL: reorganizar a lista não troca a identidade do addon.
function addonSourceKey(manifestUrl) {
  let hash = 2166136261;
  for (let i = 0; i < manifestUrl.length; i++) {
    hash ^= manifestUrl.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `a${(hash >>> 0).toString(36)}`;
}

function normalizeAddonManifestUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    parsed.hash = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    if (!parsed.pathname.endsWith('/manifest.json')) {
      parsed.pathname = `${parsed.pathname}/manifest.json`;
    }
    const manifestUrl = parsed.toString();
    const basePath = parsed.pathname.replace(/\/manifest\.json$/, '').replace(/\/$/, '');
    return { manifestUrl, basePath };
  } catch {
    return null;
  }
}

function normalizeAddonResources(manifest) {
  const globalTypes = Array.isArray(manifest.types) ? manifest.types : [];
  const globalPrefixes = Array.isArray(manifest.idPrefixes) ? manifest.idPrefixes : undefined;
  const supportedNames = new Set(['catalog', 'meta', 'stream', 'subtitles']);
  const normalized = [];

  for (const raw of Array.isArray(manifest.resources) ? manifest.resources : []) {
    const resource = typeof raw === 'string' ? { name: raw } : raw;
    if (!resource || typeof resource.name !== 'string' || !supportedNames.has(resource.name)) continue;

    const types = Array.isArray(resource.types) ? resource.types : globalTypes;
    const idPrefixes = Object.prototype.hasOwnProperty.call(resource, 'idPrefixes')
      ? (Array.isArray(resource.idPrefixes) ? resource.idPrefixes : [])
      : globalPrefixes;

    normalized.push({ name: resource.name, types, idPrefixes });
  }
  return normalized;
}

function mapWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  });
  return Promise.all(workers).then(() => results);
}

async function loadExternalAddons(env, ctx) {
  const unique = [];
  const seen = new Set();
  const configured = await readAddonConfig(env);
  for (const entry of configured) {
    const rawUrl = typeof entry === 'string' ? entry : entry.url;
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
    const normalized = normalizeAddonManifestUrl(rawUrl.trim());
    if (!normalized || seen.has(normalized.manifestUrl)) continue;
    seen.add(normalized.manifestUrl);
    // Guarda a entrada de configuração junto, para nome/catálogos/idiomas por addon funcionarem.
    unique.push({ ...normalized, entry });
  }

  const loaded = await mapWithConcurrency(unique, 6, async (item) => {
    const normalized = item;
    const entry = item.entry;
    const memoryHit = addonManifestMemory.get(normalized.manifestUrl);
    let manifest = memoryHit && memoryHit.expiresAt > Date.now() ? memoryHit.manifest : null;

    if (!manifest) {
      try {
        manifest = await cached(
          env,
          ctx,
          `external-addon-manifest:${normalized.manifestUrl}`.slice(0, 400),
          ADDON_MANIFEST_TTL,
          async () => {
            const response = await fetch(normalized.manifestUrl, {
              headers: { Accept: 'application/json' },
            });
            if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
            const data = await response.json();
            if (!data || typeof data.id !== 'string' || !Array.isArray(data.resources)) {
              throw new Error('Manifest externo inválido');
            }
            return data;
          }
        );
      } catch {
        return null;
      }

      if (manifest) {
        addonManifestMemory.set(normalized.manifestUrl, {
          manifest,
          expiresAt: Date.now() + ADDON_MANIFEST_TTL * 1000,
        });
      }
    }

    if (!manifest) return null;
    return {
      key: addonSourceKey(normalized.manifestUrl),
      manifestUrl: normalized.manifestUrl,
      basePath: normalized.basePath,
      displayName: (typeof entry === 'object' && entry.name) || manifest.name || manifest.id,
      disabledCatalogs: (typeof entry === 'object' && entry.disabledCatalogs) || [],
      catalogNames: (typeof entry === 'object' && entry.catalogNames) || {},
      preferredLanguages: (typeof entry === 'object' && Array.isArray(entry.languages) ? entry.languages : []).map((x) => String(x).toLowerCase()),
      preferredQualities: (typeof entry === 'object' && Array.isArray(entry.qualities) ? entry.qualities : []).map((x) => String(x).toLowerCase()),
      manual: (typeof entry === 'object' && entry.manual && entry.manual.enabled) ? entry.manual : null,
      manifest,
      resources: normalizeAddonResources(manifest),
    };
  });

  return loaded.filter(Boolean);
}

function makeAggregateItemId(sourceKey, originalId) {
  return `${ADDON_ITEM_PREFIX}${sourceKey}_${encodeBase64Url(originalId)}`;
}

function parseAggregateItemId(value) {
  const match = String(value).match(/^agg_(a[a-z0-9]+)_([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  try {
    return { key: match[1], originalId: decodeBase64Url(match[2]) };
  } catch {
    return null;
  }
}

function makeExternalCatalogId(sourceKey, originalId) {
  return `${ADDON_CATALOG_PREFIX}${sourceKey}_${encodeBase64Url(originalId)}`;
}

function parseExternalCatalogId(value) {
  const match = String(value).match(/^ext_(a[a-z0-9]+)_([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  try {
    return { key: match[1], originalId: decodeBase64Url(match[2]) };
  } catch {
    return null;
  }
}

function makeAggregateSubtitleId(sourceKey, originalId) {
  return `${ADDON_SUBTITLE_PREFIX}${sourceKey}_${encodeBase64Url(originalId)}`;
}

function parseAggregateSubtitleId(value) {
  const match = String(value).match(/^asub_(a[a-z0-9]+)_([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  try {
    return { key: match[1], originalId: decodeBase64Url(match[2]) };
  } catch {
    return null;
  }
}

function supportsAddonResource(addon, resourceName, type) {
  return addon.resources.some((resource) =>
    resource.name === resourceName && resource.types.includes(type)
  );
}

function supportsAddonId(addon, resourceName, type, id) {
  return addon.resources.some((resource) => {
    if (resource.name !== resourceName || !resource.types.includes(type)) return false;
    return resource.idPrefixes === undefined || resource.idPrefixes.some((prefix) => String(id).startsWith(prefix));
  });
}

function mergedResourceDescriptor(resources, resourceName, aggregatePrefix) {
  const matches = resources.filter((resource) => resource.name === resourceName);
  if (!matches.length) return null;

  const types = [...new Set(matches.flatMap((resource) => resource.types))];
  const hasWildcard = matches.some((resource) => resource.idPrefixes === undefined);
  const prefixes = [...new Set(matches.flatMap((resource) => resource.idPrefixes || []))];
  if (aggregatePrefix && !hasWildcard) prefixes.push(aggregatePrefix);

  return {
    name: resourceName,
    types,
    ...(hasWildcard ? {} : { idPrefixes: [...new Set(prefixes)] }),
  };
}

async function buildCombinedManifest(env, ctx) {
  const addons = await loadExternalAddons(env, ctx);
  const ownResources = normalizeAddonResources(MANIFEST);
  const allResources = [...ownResources, ...addons.flatMap((addon) => addon.resources)];
  const types = new Set(Array.isArray(MANIFEST.types) ? MANIFEST.types : []);
  const catalogs = [...(Array.isArray(MANIFEST.catalogs) ? MANIFEST.catalogs : [])];

  for (const addon of addons) {
    for (const type of Array.isArray(addon.manifest.types) ? addon.manifest.types : []) types.add(type);
    for (const resource of addon.resources) {
      for (const type of resource.types) types.add(type);
    }

    for (const catalog of Array.isArray(addon.manifest.catalogs) ? addon.manifest.catalogs : []) {
      if (!catalog || !catalog.id || !catalog.type) continue;
      if ((addon.disabledCatalogs || []).includes(catalog.id)) continue;
      if (!supportsAddonResource(addon, 'catalog', catalog.type)) continue;
      catalogs.push({
        ...catalog,
        id: makeExternalCatalogId(addon.key, catalog.id),
        name: `${addon.displayName || addon.manifest.name || addon.manifest.id} — ${(addon.catalogNames || {})[catalog.id] || catalog.name || catalog.id}`,
      });
    }
  }

  const resources = [];
  if (allResources.some((resource) => resource.name === 'catalog')) resources.push('catalog');
  const meta = mergedResourceDescriptor(allResources, 'meta', ADDON_ITEM_PREFIX);
  const stream = mergedResourceDescriptor(allResources, 'stream', ADDON_ITEM_PREFIX);
  const subtitles = mergedResourceDescriptor(allResources, 'subtitles', ADDON_SUBTITLE_PREFIX);
  if (meta) resources.push(meta);
  if (stream) resources.push(stream);
  if (subtitles) resources.push(subtitles);

  return {
    ...MANIFEST,
    name: 'Sintonize',
    version: VERSION,
    description: 'Sintonize: agregador de catálogos e fontes de addons, com metadados em português.',
    logo: logoUrl(env),
    icon: logoUrl(env),
    resources,
    types: [...types],
    catalogs,
  };
}

function encodePathSegment(value) {
  // Preserva os dois-pontos usados por IDs como tmdb:123 e canal:exemplo.
  return encodeURIComponent(String(value)).replace(/%3A/gi, ':');
}

function makeAddonResourceUrl(addon, resource, type, id, incomingUrl, extraPath = '') {
  const target = new URL(addon.manifestUrl);
  const route = `/${resource}/${encodePathSegment(type)}/${encodePathSegment(id)}` +
    `${extraPath ? `/${extraPath}` : ''}.json`;
  target.pathname = `${addon.basePath}${route}` || route;

  for (const [key, value] of incomingUrl.searchParams) target.searchParams.set(key, value);
  return target;
}

async function fetchAddonJson(addon, resource, type, id, incomingUrl, extraPath = '') {
  try {
    const target = makeAddonResourceUrl(addon, resource, type, id, incomingUrl, extraPath);
    const response = await fetch(target.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function aggregateJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=300' },
  });
}

function namespaceMeta(meta, sourceKey, fallbackId) {
  if (!meta || typeof meta !== 'object') return meta;
  const originalId = meta.id || fallbackId;
  const output = { ...meta, id: makeAggregateItemId(sourceKey, originalId) };
  if (Array.isArray(output.videos)) {
    output.videos = output.videos.map((video) => ({
      ...video,
      id: makeAggregateItemId(sourceKey, video.id),
    }));
  }
  return output;
}

function getAddonByKey(addons, key) {
  return addons.find((addon) => addon.key === key) || null;
}

async function handleCombinedCatalog(url, env, ctx) {
  const match = url.pathname.match(/^\/catalog\/([^/]+)\/([^/]+?)(?:\/(.+))?\.json$/);
  if (!match) return null;

  let catalogId;
  let type;
  try {
    type = decodeURIComponent(match[1]);
    catalogId = decodeURIComponent(match[2]);
  } catch {
    return null;
  }

  const parsed = parseExternalCatalogId(catalogId);
  if (!parsed) return null;

  const addons = await loadExternalAddons(env, ctx);
  const addon = getAddonByKey(addons, parsed.key);
  if (!addon) return aggregateJsonResponse({ metas: [] });

  const catalog = (addon.manifest.catalogs || []).find((item) =>
    item && item.id === parsed.originalId && item.type === type
  );
  if (!catalog || !supportsAddonResource(addon, 'catalog', type)) {
    return aggregateJsonResponse({ metas: [] });
  }

  const data = await fetchAddonJson(addon, 'catalog', type, catalog.id, url, match[3] || '');
  if (!data) return aggregateJsonResponse({ metas: [] });

  const metas = Array.isArray(data.metas)
    ? data.metas.filter((meta) => meta && meta.id).map((meta) => ({
        ...meta,
        id: makeAggregateItemId(addon.key, meta.id),
      }))
    : [];
  return aggregateJsonResponse({ ...data, metas });
}

async function fetchLocalTmdbMeta(type, id, env, ctx) {
  if (!env.TMDB_API_KEY || !['movie', 'series'].includes(type)) return null;
  try {
    return await cached(env, ctx, `meta:${type}:${id}`, type === 'movie' ? 7 * DAY : DAY, async () => {
      const tmdbId = await resolveTmdbId(type, id, env);
      if (!tmdbId) return null;
      return type === 'movie' ? buildMovie(id, tmdbId, env) : buildSeries(id, tmdbId, env);
    });
  } catch {
    return null;
  }
}

async function metaFromOriginById(url, type, id) {
  const path = `/meta/${encodePathSegment(type)}/${encodePathSegment(id)}.json`;
  try {
    const response = await fetch(`${ORIGIN}${path}${url.search}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function handleNamespacedMeta(url, env, ctx, type, aggregateId) {
  const addons = await loadExternalAddons(env, ctx);
  const owner = getAddonByKey(addons, aggregateId.key);
  const candidates = addons
    .filter((addon) => supportsAddonId(addon, 'meta', type, aggregateId.originalId))
    .sort((a, b) => Number(b.key === aggregateId.key) - Number(a.key === aggregateId.key));

  for (const addon of candidates) {
    const data = await fetchAddonJson(addon, 'meta', type, aggregateId.originalId, url);
    if (data && data.meta) {
      return aggregateJsonResponse({ ...data, meta: namespaceMeta(data.meta, aggregateId.key, aggregateId.originalId) });
    }
  }

  // Alguns catálogos fornecem IDs IMDb/TMDB sem oferecer metadados próprios.
  const localMeta = await fetchLocalTmdbMeta(type, aggregateId.originalId, env, ctx);
  if (localMeta) return aggregateJsonResponse({ meta: namespaceMeta(localMeta, aggregateId.key, aggregateId.originalId) });

  const originData = await metaFromOriginById(url, type, aggregateId.originalId);
  if (originData && originData.meta) {
    return aggregateJsonResponse({ ...originData, meta: namespaceMeta(originData.meta, aggregateId.key, aggregateId.originalId) });
  }

  if (!owner) return aggregateJsonResponse({ meta: null }, 404);
  return aggregateJsonResponse({ meta: null }, 404);
}

async function handleRawExternalMeta(url, env, ctx, type, id) {
  const addons = await loadExternalAddons(env, ctx);
  const candidates = addons.filter((addon) => supportsAddonId(addon, 'meta', type, id));
  for (const addon of candidates) {
    const data = await fetchAddonJson(addon, 'meta', type, id, url);
    if (data && data.meta) return aggregateJsonResponse(data);
  }
  return null;
}

async function handleCombinedMeta(url, env, ctx) {
  const match = url.pathname.match(/^\/meta\/([^/]+)\/(.+)\.json$/);
  if (!match) return null;

  let type;
  let id;
  try {
    type = decodeURIComponent(match[1]);
    id = decodeURIComponent(match[2]);
  } catch {
    return null;
  }

  const aggregateId = parseAggregateItemId(id);
  if (aggregateId) return handleNamespacedMeta(url, env, ctx, type, aggregateId);
  return null;
}

// ---------- Streams: filtros e formatação ----------

function hasBlockedLabel(text, terms) {
  const upper = String(text || '').toUpperCase();
  return (terms || []).some((term) => {
    const t = String(term || '').trim().toUpperCase();
    if (!t) return false;
    if (t === 'CAM' && /(^|[^A-Z0-9])(?:CAM|CAMRIP|HDCAM)(?=$|[^A-Z0-9])/i.test(upper)) return true;
    if (t === 'TS' && /(^|[^A-Z0-9])(?:TS|HDTS|TELESYNC)(?=$|[^A-Z0-9])/i.test(upper)) return true;
    if (t === 'SD' && /(^|[^A-Z0-9])(?:SD|480P|576P)(?=$|[^A-Z0-9])/i.test(upper)) return true;
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^A-Z0-9])' + escaped + '($|[^A-Z0-9])', 'i').test(upper);
  });
}

// false = tira o cabeçalho ▰▰▰ ADDON ▰▰▰ antes de cada grupo.
const GROUP_HEADERS = true;
const ADDON_COLORS = ['🟦', '🟩', '🟧', '🟪', '🟥', '🟨', '🟫', '⬜'];
const RES_SCORE = { '4K': 5, '1440p': 4, '1080p': 3, '720p': 2, '576p': 1, '480p': 1 };
const AVAIL_ORDER = { ready: 0, direct: 1, download: 2, wait: 3, torrent: 4, unknown: 5 };

function fmtBytes(b) {
  if (!b || !isFinite(b)) return '';
  return b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : Math.round(b / 1e6) + ' MB';
}

function analyzeStream(entry) {
  const hints = entry.behaviorHints || {};
  const desc = Array.isArray(entry.description) ? entry.description.join('\n') : entry.description;
  const hintExtra = [hints.streamQuality, hints.preferredAudioLanguage === 'por' ? 'PT-BR' : ''];
  const raw = [entry.name, entry.title, desc, ...hintExtra].filter(Boolean).map(String).join('\n');

  // Resolução e origem
  const rm = raw.match(/\b(2160p|4k|uhd|1440p|1080p|720p|576p|480p)\b/i);
  let resolution = rm ? rm[1].toLowerCase() : '';
  if (['2160p', '4k', 'uhd'].includes(resolution)) resolution = '4K';
  if (!resolution) {
    if (/\b(fhd|full[ .-]?hd)\b/i.test(raw)) resolution = '1080p';
    else if (/\bhd\b/i.test(raw)) resolution = '720p';
  }
  const sm = raw.match(/\b(remux|blu[- .]?ray|bdrip|brrip|web[- .]?dl|webrip|hdtv|dvdrip|hdrip|hdcam|camrip|hdts|telesync|cam)\b/i);
  let source = '';
  if (sm) {
    const s = sm[1].toLowerCase().replace(/[ .]/g, '-');
    source = s === 'remux' ? 'REMUX' : /^blu-?ray$/.test(s) ? 'BluRay' : s === 'web-dl' || s === 'webdl' ? 'WEB-DL' : s === 'webrip' ? 'WEBRip' : s.toUpperCase();
  }
  const srcKey = !source ? 'nd'
    : source === 'REMUX' ? 'remux'
    : (source === 'BluRay' || source === 'BDRIP' || source === 'BRRIP') ? 'bluray'
    : source === 'WEB-DL' ? 'webdl'
    : source === 'WEBRip' ? 'webrip'
    : source === 'HDTV' ? 'hdtv'
    : 'outro';

  // HDR
  const hdr = [];
  if (/dolby[ .-]?vision|\bdv\b|\bdovi\b/i.test(raw)) hdr.push('Dolby Vision');
  if (/hdr10\+|hdr10plus/i.test(raw)) hdr.push('HDR10+');
  else if (/hdr10/i.test(raw)) hdr.push('HDR10');
  else if (/\bhdr\b/i.test(raw)) hdr.push('HDR');

  // Vídeo
  let codec = '';
  if (/\b(x265|h[ .]?265|hevc)\b/i.test(raw)) codec = 'H.265';
  else if (/\b(x264|h[ .]?264|avc)\b/i.test(raw)) codec = 'H.264';
  else if (/\bav1\b/i.test(raw)) codec = 'AV1';
  const codecKey = codec === 'H.265' ? 'h265' : codec === 'H.264' ? 'h264' : codec === 'AV1' ? 'av1' : 'nd';
  const cm = raw.match(/\b(mkv|mp4|avi)\b/i);
  const container = cm ? cm[1].toUpperCase() : '';

  // Áudio (formato e canais)
  const aud = [];
  if (/atmos/i.test(raw)) aud.push('Atmos');
  if (/truehd/i.test(raw)) aud.push('TrueHD');
  if (/dts[- .]?hd/i.test(raw)) aud.push('DTS-HD');
  else if (/\bdts\b/i.test(raw)) aud.push('DTS');
  if (/\b(ddp|dd\+|e-?ac-?3)\b/i.test(raw)) aud.push('DD+');
  else if (/\b(ac-?3|dolby digital)\b/i.test(raw)) aud.push('DD');
  if (/\baac\b/i.test(raw)) aud.push('AAC');
  const chm = raw.match(/\b(7\.1|5\.1|2\.1|2\.0)\s?(?:ch)?\b/i);
  if (chm) aud.push(chm[1]);

  // Idioma do áudio
  const dual = /\bdual\b|dual[- .]?audio/i.test(raw);
  const dubbed = /dublado|\bdub\b|pt[- .]?br\b|portugu[eê]s|🇧🇷/i.test(raw);
  const multi = /\bmulti\b/i.test(raw);
  const eng = /\b(english|ingl[eê]s|eng)\b/i.test(raw);
  let language = '';
  if (dual) language = 'Dual (PT-BR + original)';
  else if (dubbed) language = 'Dublado PT-BR';
  else if (multi) language = 'Multi-áudio';
  else if (eng) language = 'Inglês';
  const langConfirmed = /confirmado/i.test(raw);

  // Legenda
  const hasSubs = /legendad[oa]|\bleg\b|\bsubs?\b|legenda|subtitles?|\bsrt\b/i.test(raw) && !/sem legenda|no subs/i.test(raw);
  const subsPt = /legend\w*[^\n]{0,20}(pt|portugu)|(pt[- .]?br|portugu\w*)[^\n]{0,20}(sub|leg)/i.test(raw);
  const subs = hasSubs ? (subsPt ? 'PT-BR' : 'incluída') : '';

  // Tamanho, bitrate, seeders
  let sizeBytes = hints.videoSize ? Number(hints.videoSize) || 0 : 0;
  let size = sizeBytes ? fmtBytes(sizeBytes) : '';
  if (!size) {
    const z = raw.match(/(\d+(?:[.,]\d+)?)\s?(GB|MB|GiB|MiB)\b/i);
    if (z) {
      const n = parseFloat(z[1].replace(',', '.'));
      const gb = /^g/i.test(z[2]);
      sizeBytes = n * (gb ? 1e9 : 1e6);
      size = z[1].replace(',', '.') + ' ' + z[2].toUpperCase().replace('I', '');
    }
  }
  const bm = raw.match(/(\d+(?:[.,]\d+)?)\s?mbps/i);
  const bitrate = bm ? bm[1].replace(',', '.') + ' Mbps' : '';
  const sd = raw.match(/(?:👥|👤|seeders?|seeds?)\s*[:=]?\s*(\d+)/i);
  const seeders = sd ? sd[1] : '';

  // Arquivo
  let filename = hints.filename || '';
  if (!filename) {
    const fl = raw.split('\n').map((l) => l.trim()).find((l) => /\.(mkv|mp4|avi|mov)$/i.test(l));
    if (fl) filename = fl.replace(/^[^A-Za-z0-9\[(]+/, '');
  }
  if (filename.length > 90) filename = filename.slice(0, 87) + '…';

  // Serviço e disponibilidade
  let service = '';
  if (/torbox|\btb\b|\[tb/i.test(raw)) service = 'TorBox';
  else if (/real[- ]?debrid|\brd\b|\[rd/i.test(raw)) service = 'Real-Debrid';
  else if (/alldebrid|\bad\b/i.test(raw)) service = 'AllDebrid';
  else if (/premiumize/i.test(raw)) service = 'Premiumize';
  else if (/debrid-?link/i.test(raw)) service = 'Debrid-Link';

  let avail = 'unknown';
  if (/⚡|pronto|cached|instant|\[\w+\+\]/i.test(raw)) avail = 'ready';
  else if (/abre no navegador|salva o arquivo|baixar o arquivo|download direto|\bdownload\b|📥/i.test(raw)) avail = 'download';
  else if (entry.infoHash && !entry.url) avail = 'torrent';
  else if (/⏳|uncached|não está/i.test(raw) && service) avail = 'wait';
  else if (entry.url) avail = 'direct';

  return {
    raw, resolution, source, hdr, codec, container, audio: aud, language, langConfirmed, subs, size, sizeBytes, bitrate, seeders, filename, service, avail,
    srcKey, codecKey,
    langKey: dual ? 'dual' : dubbed ? 'dublado' : multi ? 'multi' : eng ? 'ingles' : 'nd',
    resKey: resolution === '4K' ? '4K' : (resolution === '1080p' || resolution === '1440p') ? '1080p' : resolution === '720p' ? '720p' : resolution ? 'sd' : 'nd',
  };
}

// Aplica a configuração de filtros (a global das abas Qualidade/Idiomas ou a manual do addon).
// Devolve null se a fonte deve sumir, ou um número de "penalidade" (menor = aparece antes).
function filterStream(info, cfg) {
  const allowed = (list, key) => !Array.isArray(list) || !list.length || key === 'nd' || list.includes(key);
  if (!allowed(cfg.allowLang, info.langKey)) return null;
  if (!allowed(cfg.allowRes, info.resKey)) return null;
  if (!allowed(cfg.allowSource, info.srcKey)) return null;
  if (!allowed(cfg.allowCodec, info.codecKey)) return null;
  if (cfg.onlyReady && info.avail !== 'ready' && info.avail !== 'direct') return null;
  if (cfg.hideDownload && ['download', 'torrent', 'wait'].includes(info.avail)) return null;
  if (cfg.hdr === 'only' && !info.hdr.length) return null;
  if (cfg.hdr === 'hide' && info.hdr.length) return null;
  if (cfg.subs === 'only' && !info.subs) return null;
  if (info.sizeBytes) {
    const gb = info.sizeBytes / 1e9;
    if (cfg.minGB && gb < cfg.minGB) return null;
    if (cfg.maxGB && gb > cfg.maxGB) return null;
  }
  const blocked = hasBlockedLabel(info.raw, cfg.excludeTerms);
  if (blocked && cfg.hideBlocked) return null;

  let rank = blocked ? 100 : 0;
  if (Array.isArray(cfg.allowLang) && cfg.allowLang.length && info.langKey === 'nd' && !cfg.allowLang.includes('nd')) rank += 4;
  if (cfg.hdr === 'prefer' && !info.hdr.length) rank += 2;
  if (cfg.subs === 'prefer' && !info.subs) rank += 2;
  if (cfg.langFirst && cfg.langFirst !== 'auto' && info.langKey !== cfg.langFirst) rank += 3;
  return rank;
}

function compareStreams(sortBy) {
  const size = (x) => x._s || 0;
  return (a, b) => {
    if (a._r !== b._r) return a._r - b._r;
    if (sortBy === 'res') return b._q - a._q || a._a - b._a;
    if (sortBy === 'size_desc') return size(b) - size(a) || a._a - b._a;
    if (sortBy === 'size_asc') return (size(a) || Infinity) - (size(b) || Infinity) || a._a - b._a;
    return a._a - b._a || b._q - a._q;
  };
}

function buildStreamTexts(info, addonName, color, entry) {
  // Só símbolos simples de texto, sem emojis soltos. O único colorido é o quadrado do addon.
  const marks = { ready: '⚡', direct: '▸', download: '↓', wait: '◷', torrent: '◷', unknown: '▸' };
  const titleParts = [info.resolution, info.source, info.hdr.join(' + ')].filter(Boolean).join(' · ');
  const name = `${color} ${addonName.toUpperCase()}  ${marks[info.avail]} ${titleParts || 'Fonte'}`;

  const lines = [];
  const availText = {
    ready: `Pronto${info.service ? ' no ' + info.service : ''} · é só dar play`,
    direct: 'Link direto · é só dar play',
    download: 'Precisa baixar · abre no navegador',
    torrent: 'Precisa baixar · torrent, pode demorar',
    wait: `Ainda não está no ${info.service} · precisa baixar antes`,
  }[info.avail];
  if (availText) lines.push(availText);

  lines.push(`Áudio: ${info.language || 'idioma não indicado'}${info.langConfirmed ? ' (confirmado)' : ''}`);
  lines.push(`Legenda: ${info.subs || 'sem legenda indicada'}`);

  const tech = [info.codec, info.container].filter(Boolean).join(' · ');
  if (tech) lines.push(`Vídeo: ${tech}`);
  if (info.audio.length) lines.push(`Som: ${info.audio.join(' · ')}`);

  const meta = [info.size, info.bitrate, info.seeders && info.seeders + ' seeders'].filter(Boolean).join(' · ');
  if (meta) lines.push(`Tamanho: ${meta}`);

  // Se não deu para entender nada, mostra o texto original do addon (sem inventar nada).
  if (!info.language && !tech && !info.size && !info.audio.length) {
    const d = Array.isArray(entry.description) ? entry.description.join('\n') : entry.description;
    const orig = String(d || entry.title || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 2).map((x) => x.slice(0, 110));
    lines.push(...orig);
  }
  if (info.filename) lines.push(`Arquivo: ${info.filename}`);

  const description = lines
    .map((l, i) => (lines.length === 1 ? '─ ' : i === 0 ? '┌ ' : i === lines.length - 1 ? '└ ' : '├ ') + l)
    .join('\n');
  return { name, description };
}

// Converte tmdb:ID[:temp:ep] em ttXXXX[:temp:ep] para addons que só aceitam IMDb.
async function resolveImdbForStream(type, originalId, env, ctx) {
  if (!String(originalId).startsWith('tmdb:') || !env.TMDB_API_KEY) return null;
  const [, tmdbId, ...rest] = String(originalId).split(':');
  if (!tmdbId) return null;
  const suffix = rest.length ? ':' + rest.join(':') : '';
  try {
    const imdb = await cached(env, ctx, `imdbmap:${type}:${tmdbId}`, 30 * DAY, async () => {
      const d = await tmdb(`/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}/external_ids`, env);
      return d && d.imdb_id ? d.imdb_id : null;
    });
    return imdb ? imdb + suffix : null;
  } catch {
    return null;
  }
}

// Diz o motivo de uma fonte ser descartada (usado só no ?debug=1).
function filterWhy(info, cfg) {
  const no = (list, key) => Array.isArray(list) && list.length && key !== 'nd' && !list.includes(key);
  if (no(cfg.allowLang, info.langKey)) return 'idioma "' + info.langKey + '" fora de allowLang';
  if (no(cfg.allowRes, info.resKey)) return 'resolução "' + info.resKey + '" fora de allowRes';
  if (no(cfg.allowSource, info.srcKey)) return 'origem "' + info.srcKey + '" fora de allowSource';
  if (no(cfg.allowCodec, info.codecKey)) return 'codec "' + info.codecKey + '" fora de allowCodec';
  if (cfg.onlyReady && info.avail !== 'ready' && info.avail !== 'direct') return 'onlyReady (disp. ' + info.avail + ')';
  if (cfg.hideDownload && ['download', 'torrent', 'wait'].includes(info.avail)) return 'hideDownload (disp. ' + info.avail + ')';
  if (cfg.hdr === 'only' && !info.hdr.length) return 'hdr=only e sem HDR';
  if (cfg.hdr === 'hide' && info.hdr.length) return 'hdr=hide e tem HDR';
  if (cfg.subs === 'only' && !info.subs) return 'subs=only e sem legenda';
  if (info.sizeBytes) {
    const gb = info.sizeBytes / 1e9;
    if (cfg.minGB && gb < cfg.minGB) return 'menor que minGB (' + gb.toFixed(2) + ' GB)';
    if (cfg.maxGB && gb > cfg.maxGB) return 'maior que maxGB (' + gb.toFixed(2) + ' GB)';
  }
  if (cfg.hideBlocked && hasBlockedLabel(info.raw, cfg.excludeTerms)) return 'rótulo bloqueado + hideBlocked';
  return null;
}

// ---------- Cache das fontes (streams) ----------
// Guarda, por título, o que cada addon respondeu (antes dos filtros, então mudar filtro vale na hora).
// Fontes de debrid mudam com o tempo, por isso o prazo é curto. Falhas também são lembradas por pouco
// tempo, para um addon lento não fazer a tela esperar de novo a cada abertura.
const STREAM_TTL = { ok: 15 * 60 * 1000, empty: 5 * 60 * 1000, fail: 3 * 60 * 1000 };
const streamEntryFresh = (e) => !!(e && STREAM_TTL[e.k] && typeof e.t === 'number' && Date.now() - e.t < STREAM_TTL[e.k]);

async function streamCachePut(env, key, value) {
  if (!env.CACHE) return;
  try {
    await env.CACHE.put(key, JSON.stringify(value), { expirationTtl: 3600 });
  } catch (e) {
    // limite do KV ou falha pontual: segue sem cache
  }
}

// Consulta um addon de stream com limite de tempo. Nunca trava: devolve status e tempo.
async function fetchStreamJson(addon, type, id, incomingUrl, ms = 7000) {
  const t0 = Date.now();
  try {
    const target = makeAddonResourceUrl(addon, 'stream', type, id, incomingUrl);
    const response = await fetch(target.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(ms),
    });
    if (!response.ok) return { data: null, status: response.status, ms: Date.now() - t0 };
    return { data: await response.json(), status: response.status, ms: Date.now() - t0 };
  } catch (e) {
    return { data: null, status: e && e.name === 'TimeoutError' ? 'timeout' : 'erro', ms: Date.now() - t0 };
  }
}

async function handleCombinedStream(url, env, ctx) {
  const match = url.pathname.match(/^\/stream\/([^/]+)\/(.+)\.json$/);
  if (!match) return null;

  let type;
  let id;
  try {
    type = decodeURIComponent(match[1]);
    id = decodeURIComponent(match[2]);
  } catch {
    return null;
  }

  const aggregateId = parseAggregateItemId(id);
  const originalId = aggregateId ? aggregateId.originalId : id;
  const imdbId = await resolveImdbForStream(type, originalId, env, ctx);
  const addons = await loadExternalAddons(env, ctx);
  const candidates = addons.filter((addon) => {
    if (!supportsAddonResource(addon, 'stream', type)) return false;
    return (aggregateId && addon.key === aggregateId.key)
      || supportsAddonId(addon, 'stream', type, originalId)
      || (imdbId && supportsAddonId(addon, 'stream', type, imdbId));
  });

  if (!candidates.length && !aggregateId) return null;
  // Cache por título. ?nocache=1, ?raw=1 e ?debug=1 sempre consultam os addons de verdade.
  const bypassCache = url.searchParams.get('nocache') === '1' || url.searchParams.get('raw') === '1' || url.searchParams.get('debug') === '1';
  const streamKey = `streams:v1:${type}:${originalId}`.slice(0, 400);
  const stored = bypassCache ? null : await cacheGet(env, streamKey);
  const storedAddons = (stored && stored.addons) || {};
  const results = await Promise.all(candidates.map(async (addon) => {
    const qid = imdbId && supportsAddonId(addon, 'stream', type, imdbId) ? imdbId : originalId;
    const hit = storedAddons[addon.key];
    if (streamEntryFresh(hit)) {
      return {
        addon, qid, fromCache: true, ms: 0,
        data: hit.k === 'fail' ? null : { streams: Array.isArray(hit.v) ? hit.v : [] },
        status: hit.k === 'fail' ? 'cache:' + hit.s : 'cache',
      };
    }
    const r = await fetchStreamJson(addon, type, qid, url);
    return { addon, qid, data: r.data, status: r.status, ms: r.ms };
  }));
  // Grava (1 escrita por abertura) o que veio de verdade dos addons, junto com o que ainda estava no prazo.
  if (!bypassCache && env.CACHE && results.some((r) => !r.fromCache)) {
    const merged = {};
    for (const [k, v] of Object.entries(storedAddons)) if (streamEntryFresh(v)) merged[k] = v;
    for (const r of results) {
      if (r.fromCache) continue;
      const list = r.data && Array.isArray(r.data.streams) ? r.data.streams : null;
      merged[r.addon.key] = list
        ? (list.length ? { t: Date.now(), k: 'ok', v: list } : { t: Date.now(), k: 'empty', v: [] })
        : { t: Date.now(), k: 'fail', s: String(r.status) };
    }
    ctx.waitUntil(streamCachePut(env, streamKey, { addons: merged }));
  }
  // Diagnóstico: abra a URL do stream com ?raw=1 para ver o que cada addon manda de verdade.
  if (url.searchParams.get('raw') === '1') {
    return new Response(JSON.stringify(results.map((r) => ({ addon: r.addon.displayName, idUsado: r.qid, status: r.status, ms: r.ms, streams: (r.data && r.data.streams) || null })), null, 2), { headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store' } });
  }
  const preferences = await readPreferences(env);
  const globalCfg = sanitizeFilter(preferences.filter);
  const preferredLanguages = (preferences.languages || []).map((x) => String(x).toLowerCase());
  const preferredQualities = (preferences.qualities || []).map((x) => String(x).toLowerCase());

  if (url.searchParams.get('debug') === '1') {
    const report = {
      idRecebido: id,
      idOriginal: originalId,
      filtroGlobal: globalCfg,
      addonsConfigurados: addons.map((a) => ({ nome: a.displayName, manual: !!a.manual, consultado: candidates.includes(a) })),
      resultado: results.map((r) => {
        const cfg = r.addon.manual ? sanitizeFilter(r.addon.manual) : globalCfg;
        const list = (r.data && r.data.streams) || [];
        return {
          addon: r.addon.displayName,
          filtroUsado: r.addon.manual ? 'manual' : 'global',
          status: r.status,
          ms: r.ms,
          recebidas: r.data ? list.length : 'sem resposta',
          descartadas: list.map((e) => {
            const i = analyzeStream(e);
            const why = filterWhy(i, cfg);
            return why ? { motivo: why, nome: String(e.name || e.title || '').slice(0, 60) } : null;
          }).filter(Boolean),
        };
      }),
    };
    return new Response(JSON.stringify(report, null, 2), { headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store' } });
  }

  const output = [];
  const seen = new Set();

  for (const result of results) {
    const entries = result.data && Array.isArray(result.data.streams) ? result.data.streams : [];
    const addonName = result.addon.displayName || result.addon.manifest.name || 'Addon';
    const colorIdx = Math.max(0, addons.findIndex((a) => a.key === result.addon.key));
    const color = ADDON_COLORS[colorIdx % ADDON_COLORS.length];
    const group = [];
    // Configuração manual do addon (quando ligada) manda no lugar das abas Qualidade e Idiomas.
    const cfg = result.addon.manual ? sanitizeFilter(result.addon.manual) : globalCfg;

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const signature = entry.url || entry.ytId || entry.infoHash || JSON.stringify(entry);
      if (seen.has(signature)) continue;
      seen.add(signature);

      const info = analyzeStream(entry);
      const lower = info.raw.toLowerCase();
      const filterRank = filterStream(info, cfg);
      if (filterRank === null) continue;

      const langPrefs = [...preferredLanguages, ...(result.addon.preferredLanguages || [])];
      const qualityPrefs = [...preferredQualities, ...(result.addon.preferredQualities || [])];
      const langHit = langPrefs.length && langPrefs.some((x) => lower.includes(x));
      const qualityHit = qualityPrefs.length && qualityPrefs.some((x) => lower.includes(x));
      const rank = filterRank + (langPrefs.length && !langHit ? 10 : 0) + (qualityPrefs.length && !qualityHit ? 5 : 0);

      const texts = buildStreamTexts(info, addonName, color, entry);
      group.push({ ...entry, name: texts.name, description: texts.description, _r: rank, _a: AVAIL_ORDER[info.avail], _q: RES_SCORE[info.resolution] || 0, _s: info.sizeBytes, _ready: info.avail === 'ready' });
    }

    if (!group.length) continue;
    group.sort(compareStreams(cfg.sortBy));
    const limited = cfg.maxPerAddon > 0 ? group.slice(0, cfg.maxPerAddon) : group;

    if (GROUP_HEADERS) {
      const ready = limited.filter((g) => g._ready).length;
      output.push({
        name: `▰▰▰  ${color} ${addonName.toUpperCase()}  ▰▰▰`,
        description: `${limited.length} ${limited.length === 1 ? 'fonte' : 'fontes'}${ready ? ` · ${ready} ${ready === 1 ? 'pronta' : 'prontas'}` : ''}`,
        externalUrl: url.origin,
      });
    }
    for (const { _r, _a, _q, _s, _ready, ...stream } of limited) output.push(stream);
  }

  return new Response(JSON.stringify({ streams: output }), {
    status: 200,
    headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store' },
  });
}

async function handleCombinedSubtitles(url, env, ctx) {
  const match = url.pathname.match(/^\/subtitles\/([^/]+)\/(.+)\.json$/);
  if (!match) return null;

  let type;
  let id;
  try {
    type = decodeURIComponent(match[1]);
    id = decodeURIComponent(match[2]);
  } catch {
    return null;
  }

  const subtitleId = parseAggregateSubtitleId(id);
  const videoId = parseAggregateItemId(url.searchParams.get('videoID') || '');
  const sourceKey = subtitleId?.key || videoId?.key;
  if (!sourceKey) return null;

  const addons = await loadExternalAddons(env, ctx);
  const addon = getAddonByKey(addons, sourceKey);
  if (!addon || !supportsAddonResource(addon, 'subtitles', type)) {
    return aggregateJsonResponse({ subtitles: [] });
  }

  const originalSubtitleId = subtitleId ? subtitleId.originalId : id;
  const target = makeAddonResourceUrl(addon, 'subtitles', type, originalSubtitleId, url);
  if (videoId) target.searchParams.set('videoID', videoId.originalId);

  let data = null;
  try {
    const response = await fetch(target.toString(), { headers: { Accept: 'application/json' } });
    if (response.ok) data = await response.json();
  } catch {
    data = null;
  }

  const subtitles = Array.isArray(data?.subtitles)
    ? data.subtitles.map((subtitle) => ({
        ...subtitle,
        id: makeAggregateSubtitleId(addon.key, subtitle.id),
      }))
    : [];
  return aggregateJsonResponse({ ...(data || {}), subtitles });
}

// ============================================================================
// ROTEAMENTO
// ============================================================================
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);

    if (url.pathname === '/') {
      return new Response(homePage(env, url.origin), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }

    if (url.pathname === '/f') return await focusRoute(url, request);

    if (url.pathname === '/version-check') {
      const info = await latestVersionInfo(env, ctx);
      const latest = info ? info.version : null;
      const body = {
        current: VERSION,
        latest,
        updateAvailable: !!latest && compareVersions(latest, VERSION) > 0,
        descricao: info ? info.descricao : '',
        download: info ? info.download : '',
      };
      return new Response(JSON.stringify(body), { headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store' } });
    }

    if (url.pathname === '/collection.json') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Método não permitido', { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } });
      return await collectionRoute(url, request, env);
    }

    const adminResponse = await handleAdmin(request, url, env);
    if (adminResponse) return adminResponse;

    if (url.pathname === '/formatter.json') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Método não permitido', { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } });
      const preferences = await readPreferences(env);
      const formatter = sanitizeFormatterPack(preferences.formatter) || DEFAULT_SINTONIZE_FORMATTER;
      return new Response(request.method === 'HEAD' ? null : JSON.stringify(formatter, null, 2), { headers: { ...JSON_HEADERS, ...CORS, 'Cache-Control': 'no-store', 'Content-Disposition': 'inline; filename="sintonize-formatter.json"' } });
    }

    // Manifesto unificado: Nuvio Meta original + manifests cadastrados.
    if (url.pathname === '/manifest.json') {
      const manifest = await buildCombinedManifest(env, ctx);
      return new Response(JSON.stringify(manifest), {
        headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=300' },
      });
    }

    const externalCatalog = await handleCombinedCatalog(url, env, ctx);
    if (externalCatalog) return externalCatalog;

    const aggregateMeta = await handleCombinedMeta(url, env, ctx);
    if (aggregateMeta) return aggregateMeta;

    const streamResponse = await handleCombinedStream(url, env, ctx);
    if (streamResponse) return streamResponse;

    const subtitlesResponse = await handleCombinedSubtitles(url, env, ctx);
    if (subtitlesResponse) return subtitlesResponse;

    // /catalog/{type}/{id}.json ou /catalog/{type}/{id}/{extra}.json
    const cat = url.pathname.match(/^\/catalog\/(movie|series)\/([^/]+?)(?:\/(.+))?\.json$/);
    if (cat) {
      const type = cat[1];
      const catalogId = decodeURIComponent(cat[2]);
      const extra = new URLSearchParams(cat[3] || '');
      let metas = [];

      if (env.TMDB_API_KEY) {
        const isSearch = catalogId.startsWith('busca-');
        const key = `cat:${type}:${catalogId}:${extra.toString().toLowerCase()}`.slice(0, 400);
        try {
          metas = (await cached(env, ctx, key, isSearch ? DAY : 6 * HOUR, async () => {
            const items = await buildCatalog(type, catalogId, extra, env);
            return items.length ? items : null;
          })) || [];
        } catch {
          metas = [];
        }
      }

      return new Response(JSON.stringify({ metas }), {
        headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=900' },
      });
    }

    // /meta/{type}/{id}.json — primeiro mantém o TMDB original.
    const metaMatch = url.pathname.match(/^\/meta\/(movie|series)\/(.+)\.json$/);
    if (metaMatch) {
      const type = metaMatch[1];
      const id = decodeURIComponent(metaMatch[2]);
      const localMeta = await fetchLocalTmdbMeta(type, id, env, ctx);
      if (localMeta) {
        return new Response(JSON.stringify({ meta: localMeta }), {
          headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=3600' },
        });
      }

      const externalMeta = await handleRawExternalMeta(url, env, ctx, type, id);
      if (externalMeta) return externalMeta;
      return metaFromOrigin(url);
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
