export type PhoneCountry = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
};

export const DEFAULT_PHONE_COUNTRY = "CL";

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "CL", name: "Chile", dial: "+56", flag: "🇨🇱" },
  { iso: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { iso: "PE", name: "Perú", dial: "+51", flag: "🇵🇪" },
  { iso: "BO", name: "Bolivia", dial: "+591", flag: "🇧🇴" },
  { iso: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
  { iso: "EC", name: "Ecuador", dial: "+593", flag: "🇪🇨" },
  { iso: "UY", name: "Uruguay", dial: "+598", flag: "🇺🇾" },
  { iso: "PY", name: "Paraguay", dial: "+595", flag: "🇵🇾" },
  { iso: "BR", name: "Brasil", dial: "+55", flag: "🇧🇷" },
  { iso: "MX", name: "México", dial: "+52", flag: "🇲🇽" },
  { iso: "US", name: "Estados Unidos", dial: "+1", flag: "🇺🇸" },
  { iso: "ES", name: "España", dial: "+34", flag: "🇪🇸" },
  { iso: "DE", name: "Alemania", dial: "+49", flag: "🇩🇪" },
  { iso: "FR", name: "Francia", dial: "+33", flag: "🇫🇷" },
  { iso: "GB", name: "Reino Unido", dial: "+44", flag: "🇬🇧" },
  { iso: "IT", name: "Italia", dial: "+39", flag: "🇮🇹" },
  { iso: "CA", name: "Canadá", dial: "+1", flag: "🇨🇦" },
  { iso: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
];

export function getPhoneCountry(iso: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.iso === iso) ?? PHONE_COUNTRIES[0];
}

export function formatFullPhone(dial: string, local: string): string {
  const digits = local.replace(/\D/g, "");
  if (!digits) return "";
  return `${dial}${digits}`;
}

export function formatPhoneDisplay(dial: string, local: string): string {
  const trimmed = local.trim();
  if (!trimmed) return "";
  return `${dial} ${trimmed}`;
}
