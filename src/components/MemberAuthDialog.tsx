"use client";

import { motion, AnimatePresence } from "framer-motion";
import { scaleBloom } from "@/lib/motion-presets";
import { LogIn, X } from "lucide-react";
import { MemberAuthPanel } from "@/components/MemberAuthPanel";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { id: string; email: string; name: string | null; role: string }) => void;
  initialEmail?: string;
  /** Si true, abre en modo iniciar sesión */
  forceLogin?: boolean;
};

export function MemberAuthDialog({
  isOpen,
  onClose,
  onLogin,
  initialEmail,
  forceLogin,
}: Props) {
  const handleSuccess = (user: { id: string; email: string; name: string | null; role: string }) => {
    onLogin(user);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            variants={scaleBloom}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden my-4"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="relative bg-navy px-6 py-5 text-white">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 pr-10">
                <div className="h-10 w-10 rounded-xl bg-teal/20 flex items-center justify-center">
                  <LogIn className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Mi cuenta Nómada</h3>
                  <p className="text-white/60 text-sm">
                    {forceLogin || initialEmail
                      ? "Inicia sesión con tu correo"
                      : "Regístrate o inicia sesión con tu correo"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <MemberAuthPanel
                key={`${initialEmail ?? ""}-${forceLogin ? "login" : "any"}-${isOpen}`}
                onSuccess={handleSuccess}
                compact
                initialEmail={initialEmail}
                initialFlow={forceLogin || initialEmail ? "login" : "login"}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
