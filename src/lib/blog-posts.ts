import type { Language } from "./translations";

export type BlogLocaleFields = Record<Language, string>;

export type BlogPost = {
  slug: string;
  title: BlogLocaleFields;
  excerpt: BlogLocaleFields;
  content: BlogLocaleFields;
  image: string;
  category: BlogLocaleFields;
  date: string;
  readTime: number;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "por-que-elegir-turismo-experiencial",
    title: {
      es: "La gente ya no compra tours: compra transformación",
      en: "People don't buy tours anymore — they buy transformation",
      fr: "On n'achète plus des tours : on achète la transformation",
      zh: "人们不再购买旅游团——他们购买转变",
      pt: "As pessoas já não compram tours: compram transformação",
    },
    excerpt: {
      es: "Conexión cultural, exclusividad, autenticidad y propósito. Así diseñamos cada experiencia en Universo Nómada.",
      en: "Cultural connection, exclusivity, authenticity and purpose. How we design every Universo Nómada experience.",
      fr: "Connexion culturelle, exclusivité, authenticité et sens. Comment nous concevons chaque expérience.",
      zh: "文化连接、独特性、真实性与意义——我们如何设计每一次体验。",
      pt: "Conexão cultural, exclusividade, autenticidade e propósito. Assim planejamos cada experiência no Universo Nómada.",
    },
    content: {
      es: "En Universo Nómada no vendemos itinerarios genéricos. Diseñamos experiencias para que vivas sin preocuparte de más — y regreses transformado.\n\nQuiénes somos: una familia nómada nacida en la Amazonía boliviana. Rocío, Ricardo y Facundo recorren Chile y Sudamérica junto a comunidades locales, compartiendo viajes que conectan naturaleza, cultura y personas.\n\nPor qué existimos: porque más personas merecen viajar con tranquilidad, profundidad y asombro. Queríamos crear una forma de viajar donde la única preocupación fuera disfrutar, descubrir y conectar.\n\nQué nos hace distintos: grupos pequeños, guías locales, logística completa y un enfoque humano. No visitas lugares — vives historias.\n\nQué impacto generamos: apoyamos economías locales, respetamos territorios ancestrales y creamos recuerdos que dejan huella en viajeros y comunidades.\n\nSíguenos en Instagram @universo.nomadaa para ver el detrás de cada experiencia, o suscríbete a nuestro blog para recibir historias que inspiran.",
      en: "At Universo Nómada we don't sell generic itineraries. We design experiences so you travel worry-free — and return transformed.\n\nWho we are: a nomad family born in the Bolivian Amazon. Rocío, Ricardo and Facundo explore Chile and South America with local communities, sharing journeys that connect nature, culture and people.\n\nWhy we exist: because more people deserve to travel with peace of mind, depth and wonder. We wanted a way of traveling where the only worry is enjoying, discovering and connecting.\n\nWhat makes us different: small groups, local guides, full logistics and a human approach. You don't visit places — you live stories.\n\nWhat impact we create: we support local economies, respect ancestral territories and create memories that leave a mark on travelers and communities.\n\nFollow us on Instagram @universo.nomadaa or subscribe to our blog for inspiring stories.",
      fr: "Chez Universo Nómada nous ne vendons pas d'itinéraires génériques. Nous concevons des expériences pour voyager l'esprit tranquille — et revenir transformé.\n\nQui nous sommes : une famille nomade née dans l'Amazonie bolivienne. Rocío, Ricardo et Facundo parcourent le Chili et l'Amérique du Sud aux côtés des communautés locales.\n\nPourquoi nous existons : plus de personnes méritent de voyager avec sérénité, profondeur et émerveillement.\n\nCe qui nous distingue : petits groupes, guides locaux, logistique complète et approche humaine.\n\nL'impact que nous générons : nous soutenons les économies locales et respectons les territoires ancestraux.\n\nSuivez-nous sur Instagram @universo.nomadaa ou abonnez-vous à notre blog.",
      zh: "在Universo Nómada，我们不卖千篇一律的行程。我们设计让你安心旅行、带着转变归来的体验。\n\n我们是谁：诞生于玻利维亚亚马逊的游牧家庭。Rocío、Ricardo和Facundo与智利和南美当地社区同行，分享连接自然、文化与人的旅程。\n\n为何存在：更多人值得安心、深入、充满惊奇地旅行。\n\n我们的不同：小团、当地向导、全程物流与人文关怀。你不是在参观地点——你在活出故事。\n\n我们创造的影响：支持当地经济，尊重祖先领土，为旅行者和社区留下印记。\n\n在Instagram @universo.nomadaa 关注我们，或订阅博客获取灵感故事。",
      pt: "No Universo Nómada não vendemos roteiros genéricos. Planejamos experiências para que você viaje sem se preocupar — e volte transformado.\n\nQuem somos: uma família nômade nascida na Amazônia boliviana. Rocío, Ricardo e Facundo percorrem o Chile e a América do Sul junto a comunidades locais.\n\nPor que existimos: mais pessoas merecem viajar com tranquilidade, profundidade e admiração.\n\nO que nos diferencia: grupos pequenos, guias locais, logística completa e abordagem humana. Você não visita lugares — vive histórias.\n\nO impacto que geramos: apoiamos economias locais e respeitamos territórios ancestrais.\n\nSiga-nos no Instagram @universo.nomadaa ou inscreva-se no blog.",
    },
    image: "/images/experiencia_andes.webp",
    category: { es: "Nuestra esencia", en: "Our essence", fr: "Notre essence", zh: "我们的本质", pt: "Nossa essência" },
    date: "2026-05-15",
    readTime: 6,
  },
  {
    slug: "comunidades-locales-impacto-real",
    title: {
      es: "Comunidades reales, impacto real: cómo viajamos",
      en: "Real communities, real impact: how we travel",
      fr: "Communautés réelles, impact réel : comment nous voyageons",
      zh: "真实社区，真实影响：我们的旅行方式",
      pt: "Comunidades reais, impacto real: como viajamos",
    },
    excerpt: {
      es: "Cada experiencia conecta con familias, artesanos y guardianes del territorio. No turismo de paso — relaciones que perduran.",
      en: "Every experience connects with families, artisans and land guardians. Not drive-by tourism — lasting relationships.",
      fr: "Chaque expérience relie familles, artisans et gardiens du territoire. Pas du tourisme de passage.",
      zh: "每次体验都与家庭、工匠和土地守护者相连。不是走马观花——而是持久的关系。",
      pt: "Cada experiência conecta famílias, artesãos e guardiões do território. Não é turismo de passagem — são relações que duram.",
    },
    content: {
      es: "El turismo experiencial empieza cuando dejas de ser espectador y te conviertes en parte de algo.\n\nEn Rapa Nui compartimos con familias rapanui que preservan la cultura ancestral. En la Amazonía boliviana navegamos con comunidades que conocen cada río y cada sonido de la selva. En el Elqui, los viticultores nos abren sus viñedos y sus historias.\n\nTestimonios humanos: nuestros viajeros hablan de encuentros que cambiaron su forma de ver el mundo — no de checklist de lugares.\n\nSostenibilidad: grupos reducidos, proveedores locales, respeto por temporadas y límites de capacidad en cada destino.\n\n¿Quieres vivir esto? Escríbenos o síguenos en @universo.nomadaa en Instagram.",
      en: "Experiential tourism begins when you stop being a spectator and become part of something.\n\nOn Rapa Nui we share with families preserving ancestral culture. In the Bolivian Amazon we navigate with communities who know every river and every sound of the jungle. In Elqui, winemakers open their vineyards and stories.\n\nHuman testimonials: our travelers speak of encounters that changed how they see the world — not a checklist of places.\n\nSustainability: small groups, local providers, respect for seasons and capacity limits at each destination.\n\nWant to live this? Write to us or follow @universo.nomadaa on Instagram.",
      fr: "Le tourisme expérientiel commence quand vous cessez d'être spectateur et devenez partie de quelque chose.\n\nÀ Rapa Nui nous partageons avec des familles qui préservent la culture ancestrale. En Amazonie bolivienne nous naviguons avec des communautés qui connaissent chaque rivière.\n\nTémoignages humains : nos voyageurs parlent de rencontres qui ont changé leur vision du monde.\n\nDurabilité : petits groupes, prestataires locaux, respect des saisons et des limites de capacité.\n\nÉcrivez-nous ou suivez @universo.nomadaa sur Instagram.",
      zh: "体验旅游从你不再是旁观者、成为一部分时开始。\n\n在复活节岛，我们与保存祖先文化的家庭同行。在玻利维亚亚马逊，我们与熟悉每条河流的社区一起航行。在埃尔基，酿酒师向我们敞开葡萄园和故事。\n\n人文见证：旅行者谈论改变他们世界观的相遇——而不是景点清单。\n\n可持续性：小团、当地供应商、尊重季节和容量限制。\n\n想体验吗？联系我们或在Instagram关注 @universo.nomadaa。",
      pt: "O turismo experiencial começa quando você deixa de ser espectador e se torna parte de algo.\n\nEm Rapa Nui compartilhamos com famílias que preservam a cultura ancestral. Na Amazônia boliviana navegamos com comunidades que conhecem cada rio e cada som da selva. No Elqui, viticultores nos abrem seus vinhedos e histórias.\n\nDepoimentos humanos: nossos viajantes falam de encontros que mudaram sua forma de ver o mundo — não de uma lista de lugares.\n\nSustentabilidade: grupos reduzidos, fornecedores locais, respeito às temporadas e limites de capacidade.\n\nQuer viver isso? Escreva-nos ou siga @universo.nomadaa no Instagram.",
    },
    image: "/images/bolivia.png",
    category: { es: "Comunidad", en: "Community", fr: "Communauté", zh: "社区", pt: "Comunidade" },
    date: "2026-05-10",
    readTime: 5,
  },
  {
    slug: "rituales-naturaleza-ciencia-cultura",
    title: {
      es: "Rituales, naturaleza, ciencia y cultura local",
      en: "Rituals, nature, science and local culture",
      fr: "Rituels, nature, science et culture locale",
      zh: "仪式、自然、科学与当地文化",
      pt: "Rituais, natureza, ciência e cultura local",
    },
    excerpt: {
      es: "Desde ceremonias ancestrales en los Andes hasta astroturismo en el desierto más limpio del mundo.",
      en: "From ancestral ceremonies in the Andes to astrotourism in the world's clearest desert skies.",
      fr: "Des cérémonies ancestrales dans les Andes à l'astrotourisme dans le désert le plus pur du monde.",
      zh: "从安第斯祖先仪式到世界上最清澈的沙漠星空。",
      pt: "De cerimônias ancestrais nos Andes ao astroturismo no deserto com o céu mais limpo do mundo.",
    },
    content: {
      es: "Naturaleza auténtica: avistamiento de ballenas en el norte de Chile, géiseres del Tatio al amanecer, Patagonia salvaje sin multitudes.\n\nRituales y cultura: terapias sonoras ancestrales en los Andes, vivencias con comunidades originarias, gastronomía que cuenta la historia de un territorio.\n\nCiencia y territorio: el Valle del Elqui como laboratorio a cielo abierto; la astronomía como puente entre el viajero y el universo.\n\nExclusividad y autenticidad: itinerarios diseñados para tu grupo, sin prisas, con guías que viven el lugar — no solo lo visitan.\n\nCada destino es una historia. Cada experiencia deja huella. Descubre más en nuestro blog y en Instagram @universo.nomadaa.",
      en: "Authentic nature: whale watching in northern Chile, Tatio geysers at dawn, wild Patagonia without crowds.\n\nRituals and culture: ancestral sound therapies in the Andes, experiences with indigenous communities, cuisine that tells a territory's story.\n\nScience and land: Elqui Valley as an open-sky laboratory; astronomy as a bridge between traveler and universe.\n\nExclusivity and authenticity: itineraries designed for your group, unhurried, with guides who live the place — not just visit it.\n\nEvery destination is a story. Every experience leaves a mark. Discover more on our blog and Instagram @universo.nomadaa.",
      fr: "Nature authentique : baleines dans le nord du Chili, geysers du Tatio à l'aube, Patagonie sauvage sans foules.\n\nRituels et culture : thérapies sonores ancestrales dans les Andes, expériences avec communautés autochtones, gastronomie qui raconte un territoire.\n\nScience et territoire : la vallée de l'Elqui comme laboratoire à ciel ouvert.\n\nExclusivité et authenticité : itinéraires conçus pour votre groupe, sans précipitation.\n\nChaque destination est une histoire. Suivez @universo.nomadaa sur Instagram.",
      zh: "真实的自然：智利北部观鲸、塔蒂奥间歇泉的黎明、无人群的野性巴塔哥尼亚。\n\n仪式与文化：安第斯祖先声音疗法、与原住民社区的体验、讲述领土故事的美食。\n\n科学与土地：埃尔基谷作为露天实验室；天文作为旅行者与宇宙的桥梁。\n\n独特与真实：为您的团队设计的不匆忙行程，与生活在当地的向导同行。\n\n每个目的地都是一个故事。在Instagram @universo.nomadaa 了解更多。",
      pt: "Natureza autêntica: avistamento de baleias no norte do Chile, gêiseres do Tatio ao amanhecer, Patagônia selvagem sem multidões.\n\nRituais e cultura: terapias sonoras ancestrais nos Andes, vivências com comunidades originárias, gastronomia que conta a história de um território.\n\nCiência e território: o Vale do Elqui como laboratório a céu aberto; astronomia como ponte entre viajante e universo.\n\nExclusividade e autenticidade: roteiros para seu grupo, sem pressa, com guias que vivem o lugar — não apenas o visitam.\n\nCada destino é uma história. Siga @universo.nomadaa no Instagram.",
    },
    image: "/images/ballenas.png",
    category: { es: "Experiencias", en: "Experiences", fr: "Expériences", zh: "体验", pt: "Experiências" },
    date: "2026-05-05",
    readTime: 5,
  },
  {
    slug: "guia-rapa-nui-2027",
    title: {
      es: "Rapa Nui: cultura viva, no solo moais",
      en: "Rapa Nui: living culture, not just moais",
      fr: "Rapa Nui : culture vivante, pas seulement les moais",
      zh: "复活节岛：活的文化，不只是摩艾",
      pt: "Rapa Nui: cultura viva, não apenas moais",
    },
    excerpt: {
      es: "Tapati 2027 y la oportunidad de conectar con la cultura rapanui de forma auténtica y respetuosa.",
      en: "Tapati 2027 and the chance to connect with Rapa Nui culture authentically and respectfully.",
      fr: "Tapati 2027 et l'opportunité de se connecter à la culture rapanui de manière authentique.",
      zh: "2027年Tapati节——真实而尊重地连接拉帕努伊文化的机会。",
      pt: "Tapati 2027 e a oportunidade de conectar com a cultura rapanui de forma autêntica e respeitosa.",
    },
    content: {
      es: "Rapa Nui no es un escenario fotográfico — es una cultura viva en medio del Pacífico.\n\nCon guías locales certificados compartimos ceremonias, gastronomía y territorios que pocas agencias muestran. Tapati 2027 será un encuentro imperdible con la identidad rapanui.\n\nDiseñamos experiencias privadas y grupales con respeto por la comunidad y sus tiempos. Incluimos vuelos, alojamiento, traslados y vivencias culturales auténticas. Reserva con anticipación.",
      en: "Rapa Nui is not a photo set — it's a living culture in the middle of the Pacific.\n\nWith certified local guides we share ceremonies, cuisine and territories few agencies show. Tapati 2027 will be an unmissable encounter with Rapanui identity.\n\nWe design private and group experiences with respect for the community and its rhythms. Flights, accommodation, transfers and authentic cultural experiences included. Book early.",
      fr: "Rapa Nui n'est pas un décor photo — c'est une culture vivante au milieu du Pacifique.\n\nAvec des guides locaux certifiés nous partageons cérémonies, gastronomie et territoires que peu d'agences montrent. Tapati 2027 sera un rendez-vous incontournable.\n\nNous concevons des expériences privées et en groupe dans le respect de la communauté. Réservez à l'avance.",
      zh: "复活节岛不是拍照背景——是太平洋中心的活文化。\n\n与认证当地向导一起，我们分享仪式、美食和少数机构展示的领土。2027年Tapati节是与拉帕努伊身份相遇的盛事。\n\n我们尊重社区及其节奏，设计私人和团体体验。请提前预订。",
      pt: "Rapa Nui não é um cenário fotográfico — é uma cultura viva no meio do Pacífico.\n\nCom guias locais certificados compartilhamos cerimônias, gastronomia e territórios que poucas agências mostram. O Tapati 2027 será um encontro imperdível com a identidade rapanui.\n\nPlanejamos experiências privadas e em grupo com respeito à comunidade e seus tempos. Reserve com antecedência.",
    },
    image: "/images/rapanui.png",
    category: { es: "Cultura", en: "Culture", fr: "Culture", zh: "文化", pt: "Cultura" },
    date: "2026-04-15",
    readTime: 6,
  },
  {
    slug: "viajes-corporativos-chile",
    title: {
      es: "Viajes corporativos con propósito: equipos que se transforman",
      en: "Purpose-driven corporate travel: teams that transform",
      fr: "Voyages d'entreprise avec sens : équipes qui se transforment",
      zh: "有目的的企业旅行：转变的团队",
      pt: "Viagens corporativas com propósito: equipes que se transformam",
    },
    excerpt: {
      es: "Retiros e incentivos que fortalecen vínculos humanos en territorios únicos de Chile y Sudamérica.",
      en: "Retreats and incentives that strengthen human bonds in unique territories across Chile and South America.",
      fr: "Retraites et incentives qui renforcent les liens humains dans des territoires uniques.",
      zh: "在智利和南美独特地域加强人际联系的静修与激励之旅。",
      pt: "Retiros e incentivos que fortalecem vínculos humanos em territórios únicos do Chile e da América do Sul.",
    },
    content: {
      es: "Los viajes corporativos bien diseñados no son solo team building — son espacios de conexión auténtica.\n\nDesde retiros en el Valle del Elqui hasta expediciones en Patagonia, combinamos naturaleza, cultura local y actividades que generan conversaciones reales.\n\nLogística completa, impacto positivo en comunidades y experiencias exclusivas para tu empresa. Contáctanos para una propuesta personalizada.",
      en: "Well-designed corporate trips are not just team building — they are spaces for authentic connection.\n\nFrom retreats in Elqui Valley to Patagonia expeditions, we combine nature, local culture and activities that spark real conversations.\n\nFull logistics, positive community impact and exclusive experiences for your company. Contact us for a tailored proposal.",
      fr: "Les voyages d'entreprise bien conçus ne sont pas que du team building — ce sont des espaces de connexion authentique.\n\nDes retraites dans la vallée de l'Elqui aux expéditions en Patagonie, nous combinons nature, culture locale et activités qui génèrent de vraies conversations.\n\nLogistique complète et impact positif sur les communautés. Contactez-nous pour une proposition sur mesure.",
      zh: "精心设计的企业旅行不只是团队建设——它们是真实连接的空间。\n\n从埃尔基谷静修到巴塔哥尼亚远征，我们结合自然、当地文化和引发真实对话的活动。\n\n全程物流、对社区的积极影响和专属企业体验。联系我们获取定制方案。",
      pt: "Viagens corporativas bem planejadas não são só team building — são espaços de conexão autêntica.\n\nDe retiros no Vale do Elqui a expedições na Patagônia, combinamos natureza, cultura local e atividades que geram conversas reais.\n\nLogística completa, impacto positivo nas comunidades e experiências exclusivas para sua empresa. Entre em contato para uma proposta personalizada.",
    },
    image: "/images/atacama-new.png",
    category: { es: "Empresa", en: "Corporate", fr: "Entreprise", zh: "企业", pt: "Empresa" },
    date: "2026-03-20",
    readTime: 5,
  },
  {
    slug: "temporada-ballenas-elqui",
    title: {
      es: "Ballenas y cielos: ciencia, naturaleza y asombro",
      en: "Whales and skies: science, nature and wonder",
      fr: "Baleines et ciels : science, nature et émerveillement",
      zh: "鲸鱼与天空：科学、自然与惊奇",
      pt: "Baleias e céus: ciência, natureza e admiração",
    },
    excerpt: {
      es: "Avistamiento de ballenas jorobadas y astroturismo en uno de los cielos más limpios del planeta.",
      en: "Humpback whale watching and astrotourism under one of Earth's clearest skies.",
      fr: "Observation de baleines à bosse et astrotourisme sous l'un des ciels les plus purs de la planète.",
      zh: "座头鲸观赏与地球上最清澈天空下的天文旅游。",
      pt: "Avistamento de baleias jubarte e astroturismo sob um dos céus mais limpos do planeta.",
    },
    content: {
      es: "Entre julio y octubre, Caleta Chañaral de Aceituno es uno de los mejores puntos de avistamiento de Chile. Navegamos con guías especializados que conocen el comportamiento de las ballenas y el ecosistema marino.\n\nLo combinamos con el Valle del Elqui — observación astronómica con la claridad que pocos lugares del mundo ofrecen.\n\nUna experiencia que une ciencia, naturaleza auténtica y momentos de silencio que transforman. Reserva con anticipación: los cupos son limitados por temporada.",
      en: "Between July and October, Chañaral de Aceituno is one of Chile's best whale watching spots. We sail with specialized guides who know whale behavior and the marine ecosystem.\n\nWe combine it with Elqui Valley — stargazing with a clarity few places on Earth offer.\n\nAn experience uniting science, authentic nature and transformative moments of silence. Book early: spots are limited by season.",
      fr: "Entre juillet et octobre, la caleta Chañaral de Aceituno est l'un des meilleurs sites d'observation du Chili. Nous naviguons avec des guides spécialisés.\n\nNous combinons avec la vallée de l'Elqui — observation astronomique avec une clarté rare.\n\nUne expérience qui unit science, nature authentique et moments de silence transformateurs. Réservez à l'avance.",
      zh: "七月至十月，查尼亚拉尔湾是智利最佳观鲸点之一。我们与了解鲸鱼行为和海洋生态的专业向导一起航行。\n\n结合埃尔基谷——在地球上少有的清澈天空下观星。\n\n融合科学、真实自然与转变性宁静时刻的体验。请提前预订，名额按季节有限。",
      pt: "Entre julho e outubro, a Caleta Chañaral de Aceituno é um dos melhores pontos de avistamento do Chile. Navegamos com guias especializados que conhecem o comportamento das baleias e o ecossistema marinho.\n\nCombinamos com o Vale do Elqui — observação astronômica com a clareza que poucos lugares do mundo oferecem.\n\nUma experiência que une ciência, natureza autêntica e momentos de silêncio transformadores. Reserve com antecedência.",
    },
    image: "/images/ballenas.png",
    category: { es: "Naturaleza", en: "Nature", fr: "Nature", zh: "自然", pt: "Natureza" },
    date: "2026-04-28",
    readTime: 5,
  },
  {
    slug: "atacama-uyuni-ruta-completa",
    title: {
      es: "Atacama + Uyuni: expedición al corazón de Sudamérica",
      en: "Atacama + Uyuni: expedition to the heart of South America",
      fr: "Atacama + Uyuni : expédition au cœur de l'Amérique du Sud",
      zh: "阿塔卡马+乌尤尼：南美腹地远征",
      pt: "Atacama + Uyuni: expedição ao coração da América do Sul",
    },
    excerpt: {
      es: "Del desierto más árido al espejo de sal. Geisers, lagunas y noches bajo estrellas infinitas.",
      en: "From the driest desert to the salt mirror. Geysers, lagoons and nights under infinite stars.",
      fr: "Du désert le plus aride au miroir de sel. Geysers, lagunes et nuits sous des étoiles infinies.",
      zh: "从最干旱沙漠到盐沼镜面。间歇泉、泻湖与无限星空下的夜晚。",
      pt: "Do deserto mais árido ao espelho de sal. Gêiseres, lagoas e noites sob estrelas infinitas.",
    },
    content: {
      es: "Cruzar de San Pedro de Atacama al Salar de Uyuni es una expedición que transforma la forma de entender la tierra.\n\nGeisers del Tatio al amanecer, lagunas altiplánicas de colores imposibles y comunidades que habitan estos paisajes extremos.\n\nRecomendamos mínimo 10 días. Coordinamos vuelos, hoteles, guías 4x4 y permisos de ingreso para que solo te importe vivir cada momento.",
      en: "Crossing from San Pedro de Atacama to the Uyuni Salt Flat is an expedition that transforms how you understand the earth.\n\nTatio geysers at dawn, impossibly colored highland lagoons and communities living in these extreme landscapes.\n\nWe recommend at least 10 days. We coordinate flights, hotels, 4x4 guides and entry permits so you only need to live each moment.",
      fr: "Traverser de San Pedro de Atacama au Salar d'Uyuni est une expédition qui transforme la façon de comprendre la terre.\n\nGeysers du Tatio à l'aube, lagunes aux couleurs impossibles et communautés de ces paysages extrêmes.\n\nNous recommandons au minimum 10 jours. Nous coordonnons vols, hôtels, guides 4x4 et permis.",
      zh: "从圣佩德罗-德阿塔卡马到乌尤尼盐沼的穿越，是一次改变你对大地理解的远征。\n\n黎明时的塔蒂奥间歇泉、色彩不可思议的高原泻湖，以及栖息于这些极端景观中的社区。\n\n建议至少10天。我们协调航班、酒店、四驱向导和入境许可。",
      pt: "Cruzar de San Pedro de Atacama ao Salar de Uyuni é uma expedição que transforma a forma de entender a terra.\n\nGêiseres do Tatio ao amanhecer, lagoas altiplânicas de cores impossíveis e comunidades que habitam essas paisagens extremas.\n\nRecomendamos no mínimo 10 dias. Coordenamos voos, hotéis, guias 4x4 e permissões para que você só precise viver cada momento.",
    },
    image: "/images/uyuni.png",
    category: { es: "Expedición", en: "Expedition", fr: "Expédition", zh: "远征", pt: "Expedição" },
    date: "2026-05-10",
    readTime: 7,
  },
  {
    slug: "patagonia-carretera-austral",
    title: {
      es: "Patagonia: naturaleza salvaje, exclusividad real",
      en: "Patagonia: wild nature, real exclusivity",
      fr: "Patagonie : nature sauvage, vraie exclusivité",
      zh: "巴塔哥尼亚：野性自然，真正的独特",
      pt: "Patagônia: natureza selvagem, exclusividade real",
    },
    excerpt: {
      es: "Catedrales de Mármol y la ruta más remota de Chile, lejos de las multitudes.",
      en: "Marble Cathedrals and Chile's most remote route, far from the crowds.",
      fr: "Cathédrales de Marbre et la route la plus reculée du Chili, loin des foules.",
      zh: "大理石教堂与智利最偏远、远离人群的路线。",
      pt: "Catedrais de Mármore e a rota mais remota do Chile, longe das multidões.",
    },
    content: {
      es: "La Carretera Austral es para viajeros que buscan naturaleza auténtica y silencio.\n\nNavegación a las Catedrales de Mármol, guías locales y ritmo pausado. Sin prisa, sin masificación.\n\nRecomendamos 8 días mínimo para recorrer Coyhaique, Puerto Río Tranquilo y los principales miradores. Ideal para quienes buscan naturaleza pura lejos de las multitudes.",
      en: "The Carretera Austral is for travelers seeking authentic nature and silence.\n\nNavigation to the Marble Cathedrals, local guides and a slow pace. No rush, no crowds.\n\nWe recommend at least 8 days to explore Coyhaique, Puerto Río Tranquilo and main viewpoints. Ideal for those seeking pure nature away from the masses.",
      fr: "La Carretera Austral est pour les voyageurs en quête de nature authentique et de silence.\n\nNavigation vers les Cathédrales de Marbre, guides locaux et rythme posé. Sans précipitation, sans masse.\n\nNous recommandons au minimum 8 jours pour Coyhaique et Puerto Río Tranquilo.",
      zh: "Austral公路适合寻求真实自然与宁静的旅行者。\n\n乘船前往大理石教堂，当地向导，慢节奏。不匆忙，不拥挤。\n\n建议至少8天游览科伊艾克和里奥特朗基洛港。适合远离人群、追求纯粹自然的人。",
      pt: "A Carretera Austral é para viajantes que buscam natureza autêntica e silêncio.\n\nNavegação às Catedrais de Mármore, guias locais e ritmo pausado. Sem pressa, sem massificação.\n\nRecomendamos no mínimo 8 dias para percorrer Coyhaique, Puerto Río Tranquilo e os principais mirantes.",
    },
    image: "/images/marmol.png",
    category: { es: "Aventura", en: "Adventure", fr: "Aventure", zh: "冒险", pt: "Aventura" },
    date: "2026-03-08",
    readTime: 6,
  },
  {
    slug: "cusco-machu-picchu-consejos",
    title: {
      es: "Cusco y Machu Picchu: historia viva, no postal",
      en: "Cusco and Machu Picchu: living history, not a postcard",
      fr: "Cusco et Machu Picchu : histoire vivante, pas une carte postale",
      zh: "库斯科与马丘比丘：活的历史，不是明信片",
      pt: "Cusco e Machu Picchu: história viva, não cartão postal",
    },
    excerpt: {
      es: "Cómo vivir la ciudadela inca con guías certificados y respeto por la cultura andina.",
      en: "How to experience the Inca citadel with certified guides and respect for Andean culture.",
      fr: "Comment vivre la cité inca avec des guides certifiés et respect de la culture andine.",
      zh: "如何与认证向导一起、怀着对安第斯文化的尊重体验印加古城。",
      pt: "Como viver a cidadela inca com guias certificados e respeito pela cultura andina.",
    },
    content: {
      es: "Machu Picchu merece tiempo, preparación y un guía que cuente la historia viva del lugar.\n\n1. Aclimatarse en Cusco al menos 2 días.\n2. Comprar entradas con semanas de anticipación.\n3. Vestir en capas — el clima cambia rápido.\n4. Contratar guía certificado para entender la historia viva.\n\nEn Universo Nómada armamos tu experiencia completa desde Chile con vuelos, hoteles y tours en español.",
      en: "Machu Picchu deserves time, preparation and a guide who tells the living history of the place.\n\n1. Acclimatize in Cusco for at least 2 days.\n2. Buy tickets weeks in advance.\n3. Dress in layers — weather changes fast.\n4. Hire a certified guide to understand the living history.\n\nAt Universo Nómada we build your complete package from Chile with flights, hotels and Spanish-speaking tours.",
      fr: "Machu Picchu mérite du temps, de la préparation et un guide qui raconte l'histoire vivante du lieu.\n\n1. Acclimatation à Cusco pendant au moins 2 jours.\n2. Achetez les billets des semaines à l'avance.\n3. Habillez-vous en couches.\n4. Engagez un guide certifié.\n\nChez Universo Nómada nous préparons votre expérience complète depuis le Chili.",
      zh: "马丘比丘值得时间、准备和一位讲述活历史的向导。\n\n1. 在库斯科适应至少2天。\n2. 提前数周购票。\n3. 分层穿衣——天气变化快。\n4. 聘请认证向导了解活的历史。\n\nUniverso Nómada从智利为您安排含航班、酒店和西班牙语导览的完整体验。",
      pt: "Machu Picchu merece tempo, preparação e um guia que conte a história viva do lugar.\n\n1. Aclimatize-se em Cusco por pelo menos 2 dias.\n2. Compre ingressos com semanas de antecedência.\n3. Vista-se em camadas — o clima muda rápido.\n4. Contrate guia certificado para entender a história viva.\n\nNo Universo Nómada montamos sua experiência completa a partir do Chile com voos, hotéis e tours em espanhol.",
    },
    image: "/images/cusco.png",
    category: { es: "Cultura", en: "Culture", fr: "Culture", zh: "文化", pt: "Cultura" },
    date: "2026-02-22",
    readTime: 5,
  },
  {
    slug: "mendoza-ruta-del-vino",
    title: {
      es: "Mendoza: enoturismo con alma de montaña",
      en: "Mendoza: wine tourism with mountain soul",
      fr: "Mendoza : œnotourisme avec âme de montagne",
      zh: "门多萨：有山魂的葡萄酒旅游",
      pt: "Mendoza: enoturismo com alma de montanha",
    },
    excerpt: {
      es: "Bodegas boutique, Malbec de altura y el Aconcagua como telón de fondo.",
      en: "Boutique wineries, high-altitude Malbec and Aconcagua as backdrop.",
      fr: "Domaines boutique, Malbec de haute altitude et l'Aconcagua en toile de fond.",
      zh: "精品酒庄、高海拔马尔贝克与阿空加瓜背景。",
      pt: "Vinícolas boutique, Malbec de altitude e o Aconcagua como pano de fundo.",
    },
    content: {
      es: "Mendoza es encuentro entre montaña, vino y personas que dedican su vida a la tierra.\n\nDegustaciones íntimas, almuerzos maridados y paisajes que enamoran. Recomendamos combinar Maipú y Luján de Cuyo con una excursión al Aconcagua.\n\nPrimavera y otoño son las mejores épocas. Consulta nuestras ofertas y reserva desde la web.",
      en: "Mendoza is where mountain, wine and people who dedicate their lives to the land meet.\n\nIntimate tastings, paired lunches and stunning landscapes. We recommend combining Maipú and Luján de Cuyo with an Aconcagua excursion.\n\nSpring and autumn are the best seasons. Check our offers and book from our website.",
      fr: "Mendoza est la rencontre entre montagne, vin et personnes qui consacrent leur vie à la terre.\n\nDégustations intimes, déjeuners accordés et paysages magnifiques. Combinez Maipú et Luján de Cuyo avec une excursion à l'Aconcagua.\n\nLe printemps et l'automne sont les meilleures saisons.",
      zh: "门多萨是山、酒与献身土地之人的交汇。\n\n私密品酒、搭配午餐与迷人风景。建议将迈普和卢扬德库约与阿空加瓜之旅结合。\n\n春秋是最佳季节。查看优惠并从网站预订。",
      pt: "Mendoza é o encontro entre montanha, vinho e pessoas que dedicam a vida à terra.\n\nDegustações íntimas, almoços harmonizados e paisagens que encantam. Recomendamos combinar Maipú e Luján de Cuyo com uma excursão ao Aconcagua.\n\nPrimavera e outono são as melhores épocas. Consulte nossas ofertas e reserve pelo site.",
    },
    image: "/images/mendoza.png",
    category: { es: "Experiencias", en: "Experiences", fr: "Expériences", zh: "体验", pt: "Experiências" },
    date: "2026-01-18",
    readTime: 4,
  },
  {
    slug: "san-pedro-atacama-astroturismo",
    title: {
      es: "Atacama: desierto, astroturismo y silencio transformador",
      en: "Atacama: desert, astrotourism and transformative silence",
      fr: "Atacama : désert, astrotourisme et silence transformateur",
      zh: "阿塔卡马：沙漠、天文与转变的寂静",
      pt: "Atacama: deserto, astroturismo e silêncio transformador",
    },
    excerpt: {
      es: "Valle de la Luna, géiseres del Tatio y el cielo más limpio del hemisferio sur.",
      en: "Moon Valley, Tatio geysers and the clearest sky in the southern hemisphere.",
      fr: "Vallée de la Lune, geysers du Tatio et le ciel le plus pur de l'hémisphère sud.",
      zh: "月亮谷、塔蒂奥间歇泉与南半球最清澈的天空。",
      pt: "Vale da Lua, gêiseres do Tatio e o céu mais limpo do hemisfério sul.",
    },
    content: {
      es: "El desierto de Atacama invita a desconectar y mirar hacia adentro.\n\nDe día: valles lunares y lagunas. De noche: galaxias con claridad única en el mundo.\n\nLevántate antes del amanecer para visitar los géiseres del Tatio — una experiencia sin comparación. Nuestros tours incluyen traslados, entradas y guías bilingües.",
      en: "The Atacama Desert invites you to disconnect and look inward.\n\nBy day: lunar valleys and lagoons. By night: galaxies with a clarity unique in the world.\n\nWake before dawn for the Tatio geysers — an unmatched experience. Our tours include transfers, tickets and bilingual guides.",
      fr: "Le désert d'Atacama invite à se déconnecter et à regarder vers l'intérieur.\n\nLe jour : vallées lunaires et lagunes. La nuit : galaxies d'une clarté unique au monde.\n\nLevez-vous avant l'aube pour les geysers du Tatio. Nos tours incluent transferts, entrées et guides bilingues.",
      zh: "阿塔卡马沙漠邀请你断开连接、向内看。\n\n白天：月亮谷和泻湖。夜晚：世界上独一无二的清晰银河。\n\n黎明前起床前往塔蒂奥间歇泉——无与伦比的体验。我们的行程含交通、门票和双语向导。",
      pt: "O deserto do Atacama convida a desconectar e olhar para dentro.\n\nDe dia: vales lunares e lagoas. De noite: galáxias com clareza única no mundo.\n\nAcorde antes do amanhecer para visitar os gêiseres do Tatio — uma experiência sem comparação. Nossos tours incluem traslados, ingressos e guias bilíngues.",
    },
    image: "/images/atacama-new.png",
    category: { es: "Ciencia", en: "Science", fr: "Science", zh: "科学", pt: "Ciência" },
    date: "2026-01-05",
    readTime: 5,
  },
  {
    slug: "florianopolis-playas-brasil",
    title: {
      es: "Florianópolis: costa atlántica, delfines y conexión",
      en: "Florianópolis: Atlantic coast, dolphins and connection",
      fr: "Florianópolis : côte atlantique, dauphins et connexion",
      zh: "弗洛里亚诺波利斯：大西洋海岸、海豚与连接",
      pt: "Florianópolis: costa atlântica, golfinhos e conexão",
    },
    excerpt: {
      es: "Playas, selva atlántica y la calidez brasileña en un viaje de conexión y descanso.",
      en: "Beaches, Atlantic forest and Brazilian warmth in a journey of connection and rest.",
      fr: "Plages, forêt atlantique et chaleur brésilienne dans un voyage de connexion et de repos.",
      zh: "海滩、大西洋森林与巴西热情——连接与休憩之旅。",
      pt: "Praias, mata atlântica e o calor brasileiro em uma viagem de conexão e descanso.",
    },
    content: {
      es: "Florianópolis — o Floripa para los locales — combina playas paradisíacas, surf, trillas naturales y una escena gastronómica vibrante.\n\nJoaquina, Campeche y Lagoinha do Leste son imperdibles. La mejor época es de octubre a marzo.\n\nIdeal para quienes buscan desconectar sin renunciar a la autenticidad cultural. Vuelos directos desde Santiago hacen de este destino una escapada perfecta de 5 días.",
      en: "Florianópolis — or Floripa to locals — combines paradise beaches, surfing, nature trails and vibrant food.\n\nJoaquina, Campeche and Lagoinha do Leste are must-sees. Best season is October to March.\n\nIdeal for those seeking to disconnect without giving up cultural authenticity. Direct flights from Santiago make it a perfect 5-day getaway.",
      fr: "Florianópolis — ou Floripa pour les locaux — combine plages paradisiaques, surf, sentiers naturels et gastronomie vibrante.\n\nJoaquina, Campeche et Lagoinha do Leste sont incontournables. Meilleure saison : octobre à mars.\n\nIdéal pour se déconnecter sans renoncer à l'authenticité culturelle.",
      zh: "弗洛里亚诺波利斯——当地人叫Floripa——集天堂海滩、冲浪、自然步道和美食于一体。\n\n华金纳、坎佩什和拉戈伊尼亚海滩不可错过。最佳季节是十月至三月。\n\n适合想断开连接又不放弃文化真实性的人。从圣地亚哥有直飞航班，完美的5天短途游。",
      pt: "Florianópolis — ou Floripa para os locais — combina praias paradisíacas, surf, trilhas naturais e uma cena gastronômica vibrante.\n\nJoaquina, Campeche e Lagoinha do Leste são imperdíveis. A melhor época é de outubro a março.\n\nIdeal para quem busca desconectar sem abrir mão da autenticidade cultural. Voos diretos de Santiago tornam este destino uma escapada perfeita de 5 dias.",
    },
    image: "/images/florianopolis.png",
    category: { es: "Naturaleza", en: "Nature", fr: "Nature", zh: "自然", pt: "Natureza" },
    date: "2025-12-12",
    readTime: 4,
  },
];

export function getBlogField(post: BlogPost, lang: Language, field: "title" | "excerpt" | "content" | "category"): string {
  return post[field][lang] ?? post[field].es;
}

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
