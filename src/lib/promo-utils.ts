const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function getMonthInfo(date = new Date()) {
  const monthIndex = date.getMonth();
  const month = MONTHS_ES[monthIndex];
  const year = date.getFullYear();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return {
    month,
    monthUpper: month.toUpperCase(),
    validUntil: `${lastDay} ${month} ${year}`,
    monthYearKey: `${monthIndex}-${year}`,
  };
}

export function buildDefaultPromotions() {
  const { monthUpper, validUntil } = getMonthInfo();
  return [
    { title: `Destino del Mes ${monthUpper}`, subtitle: "Mendoza, Argentina", discount: "15% OFF", destination: "Mendoza", validUntil, originalPrice: 690300, discountPrice: 586700, emoji: "🍷", image: "/images/mendoza.png" },
    { title: `Travel SALE ${monthUpper}`, subtitle: "Florianopolis, Brasil", discount: "15% OFF", destination: "Florianopolis", validUntil, originalPrice: 698000, discountPrice: 593000, emoji: "🌴", image: "/images/florianopolis.png" },
    { title: "Tapati 2027", subtitle: "Rapa Nui", discount: "15% OFF", destination: "Rapa Nui", validUntil: "Febrero 2027", originalPrice: 1126000, discountPrice: 957100, emoji: "🗿", image: "/images/rapanui.png" },
    { title: "Viaje Grupal Agosto", subtitle: "Atacama + Uyuni", discount: "10 dias", destination: "Atacama", validUntil: "03 Agosto 2026", originalPrice: 1658600, discountPrice: 1658600, emoji: "🏜️", image: "/images/uyuni.png" },
    { title: "Temporada Ballenas", subtitle: "Ballenas + Elqui", discount: "25% OFF", destination: "Ballenas", validUntil: "30 Septiembre 2026", originalPrice: 450000, discountPrice: 337500, emoji: "🐋", image: "/images/ballenas.png" },
    { title: "Patagonia Extrema", subtitle: "Catedrales + Carretera", discount: "20% OFF", destination: "Patagonia", validUntil: "31 Diciembre 2026", originalPrice: 1500000, discountPrice: 1200000, emoji: "🏔️", image: "/images/marmol.png" },
  ];
}
