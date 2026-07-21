"use client";

import { Check } from "lucide-react";

type Step = { id: number; label: string };

type Props = {
  steps: Step[];
  current: number;
};

export function CartStepIndicator({ steps, current }: Props) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <div key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    done
                      ? "bg-teal border-teal text-white"
                      : active
                        ? "border-teal text-teal bg-teal/10"
                        : "border-slate-200 text-slate-400 bg-white"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={`text-[10px] sm:text-xs text-center leading-tight max-w-[72px] ${
                    active ? "text-teal font-semibold" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 sm:mx-2 mb-5 ${
                    current > step.id ? "bg-teal" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
