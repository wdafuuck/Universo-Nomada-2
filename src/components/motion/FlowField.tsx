"use client";

type Props = {
  variant?: "hero" | "warm" | "cool" | "aurora";
  intensity?: "subtle" | "medium";
  className?: string;
};

const variantClass = {
  hero: "flow-field-hero",
  warm: "flow-field-warm",
  cool: "flow-field-cool",
  aurora: "flow-field-aurora",
} as const;

/** Campo de partículas/orbes flotantes — sensación de profundidad y flujo */
export function FlowField({
  variant = "hero",
  intensity = "subtle",
  className = "",
}: Props) {
  return (
    <div
      aria-hidden
      className={`flow-field pointer-events-none absolute inset-0 overflow-hidden ${variantClass[variant]} ${intensity === "medium" ? "flow-field-medium" : ""} ${className}`}
    >
      <span className="flow-orb flow-orb-1" />
      <span className="flow-orb flow-orb-2" />
      <span className="flow-orb flow-orb-3" />
      <span className="flow-orb flow-orb-4" />
      <span className="flow-orb flow-orb-5" />
      <span className="flow-orb flow-orb-6" />
      <div className="flow-mesh" />
    </div>
  );
}
