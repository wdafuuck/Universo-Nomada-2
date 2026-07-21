"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  formatFullPhone,
  formatPhoneDisplay,
  getPhoneCountry,
} from "@/lib/phone-countries";

type Props = {
  label?: string;
  countryIso: string;
  onCountryChange: (iso: string) => void;
  value: string;
  onChange: (local: string) => void;
  placeholder?: string;
  showPreview?: boolean;
};

export function PhoneInput({
  label,
  countryIso,
  onCountryChange,
  value,
  onChange,
  placeholder = "9 1234 5678",
  showPreview = true,
}: Props) {
  const country = getPhoneCountry(countryIso || DEFAULT_PHONE_COUNTRY);
  const preview = formatPhoneDisplay(country.dial, value);

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-sm font-medium text-slate-700">{label}</Label>}
      <div className="flex gap-2">
        <select
          value={country.iso}
          onChange={(e) => onCountryChange(e.target.value)}
          aria-label={label ?? "Código de país"}
          className={cn(
            "h-10 w-[118px] shrink-0 rounded-xl border border-input bg-white px-2 text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
          )}
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <Input
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl flex-1"
        />
      </div>
      {showPreview && preview && (
        <p className="text-xs text-slate-500">{preview}</p>
      )}
    </div>
  );
}

export { formatFullPhone, DEFAULT_PHONE_COUNTRY };
