"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, Upload, ExternalLink, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TRIP_DOCUMENT_TYPES, tripDocumentLabel } from "@/lib/trip-documents";
import {
  TRIP_DOCUMENT_NOTIFY_VARIANTS,
  type TripDocumentNotifyPreview,
  type TripDocumentNotifyVariant,
} from "@/lib/trip-document-notify-client";

type TripDocument = {
  id: number;
  docType: string;
  label: string;
  fileUrl: string;
  fileName: string;
};

const EMPTY_DOCS: TripDocument[] = [];

type Props = {
  leadId: number;
  customerEmail?: string;
  customerName?: string;
  initialDocuments?: TripDocument[];
  onChange?: (docs: TripDocument[]) => void;
};

function applyRetentionNote(
  data: {
    retention?: { tripEnded: boolean; daysRemaining: number | null; available: boolean };
    retentionDays?: number;
  },
  setRetentionNote: (note: string | null) => void,
) {
  const { retention, retentionDays } = data;
  if (!retention?.tripEnded) {
    setRetentionNote(
      `El pasajero podrá descargar estos archivos hasta ${retentionDays ?? 90} días después de la fecha de fin del viaje.`,
    );
  } else if (retention.available && retention.daysRemaining != null) {
    setRetentionNote(
      `El pasajero puede descargarlos ${retention.daysRemaining} día${retention.daysRemaining !== 1 ? "s" : ""} más; luego se eliminan automáticamente.`,
    );
  } else {
    setRetentionNote("El plazo de descarga venció; los archivos se eliminaron del servidor.");
  }
}

export function TripDocumentsEditor({
  leadId,
  customerEmail,
  initialDocuments = EMPTY_DOCS,
  onChange,
}: Props) {
  const [documents, setDocuments] = useState<TripDocument[]>(
    initialDocuments.length > 0 ? initialDocuments : EMPTY_DOCS,
  );
  const [docType, setDocType] = useState<string>(TRIP_DOCUMENT_TYPES[0].value);
  const [customLabel, setCustomLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [retentionNote, setRetentionNote] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyPreview, setNotifyPreview] = useState<TripDocumentNotifyPreview | null>(null);
  const [notifyVariant, setNotifyVariant] = useState<TripDocumentNotifyVariant>("new_documents");
  const [sendingNotify, setSendingNotify] = useState(false);

  const sync = (docs: TripDocument[]) => {
    setDocuments(docs);
    onChange?.(docs);
  };

  const load = async () => {
    const res = await fetch(`/api/admin/leads/${leadId}/documents`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    sync(data.documents ?? []);
    applyRetentionNote(data, setRetentionNote);
  };

  // Cargar desde API al cambiar de viaje (no resetear con [] en cada re-render del padre)
  useEffect(() => {
    if (initialDocuments.length > 0) {
      setDocuments(initialDocuments);
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar lead
  }, [leadId]);

  useEffect(() => {
    if (!notifyOpen || !notifyPreview) return;
    void fetch(`/api/admin/leads/${leadId}/documents/notify?variant=${notifyVariant}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.preview) setNotifyPreview(data.preview as TripDocumentNotifyPreview);
      });
    // notifyPreview en deps provocaría loop; solo re-fetch al cambiar variante/abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifyOpen, notifyVariant, leadId]);

  const openNotifyDialog = (preview: TripDocumentNotifyPreview) => {
    setNotifyPreview(preview);
    setNotifyVariant(preview.variant);
    setNotifyOpen(true);
  };

  const loadNotifyPreview = async () => {
    const res = await fetch(`/api/admin/leads/${leadId}/documents/notify`, { credentials: "include" });
    if (!res.ok) {
      toast.error("No se pudo cargar la vista previa del correo");
      return;
    }
    const data = await res.json();
    openNotifyDialog(data.preview as TripDocumentNotifyPreview);
  };

  const sendNotifyEmail = async () => {
    if (!notifyPreview) return;
    if (!customerEmail?.trim() && !notifyPreview.customerEmail.trim()) {
      toast.error("Esta reserva no tiene correo del pasajero");
      return;
    }

    setSendingNotify(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/documents/notify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: notifyVariant }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");

      toast.success(`Correo enviado a ${notifyPreview.customerEmail || customerEmail}`);
      setNotifyOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar correo");
    } finally {
      setSendingNotify(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error ?? "Error al subir");

      const res = await fetch(`/api/admin/leads/${leadId}/documents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          fileUrl: upData.url,
          fileName: file.name,
          label: docType === "otro" ? customLabel : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar documento");

      toast.success("Documento subido");
      setCustomLabel("");
      await load();

      if (data.notify) {
        openNotifyDialog(data.notify as TripDocumentNotifyPreview);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (docId: number) => {
    if (!confirm("¿Eliminar este documento?")) return;
    const res = await fetch(`/api/admin/leads/${leadId}/documents?docId=${docId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Documento eliminado");
    await load();
  };

  const typeLabel = (type: string, label?: string) => tripDocumentLabel(type, label);

  const recipientEmail = notifyPreview?.customerEmail || customerEmail || "";

  return (
    <>
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <h4 className="text-white font-semibold text-sm">Documentos del viaje</h4>
          <p className="text-white/40 text-xs mt-0.5">
            Comprobantes, vuelos, entradas, tips, seguro, etc. El cliente los verá en Mi cuenta.
          </p>
          {retentionNote && (
            <p className="text-amber-300/80 text-xs mt-1">{retentionNote}</p>
          )}
        </div>

        {documents.length > 0 ? (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                <FileText className="h-4 w-4 text-teal shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {typeLabel(doc.docType, doc.label)}
                  </p>
                  <p className="text-white/40 text-xs truncate">{doc.fileName || doc.fileUrl}</p>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal p-1 hover:text-teal/80"
                  title="Ver archivo"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => void remove(doc.id)}
                  className="text-red-400 p-1 hover:text-red-300"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/30 text-sm">Aún no hay documentos para este viaje.</p>
        )}

        {documents.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadNotifyPreview()}
            className="border-teal/30 text-teal bg-teal/10 rounded-xl w-full sm:w-auto"
          >
            <Mail className="h-4 w-4 mr-1" /> Enviar aviso por correo al pasajero
          </Button>
        )}

        <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
          >
            {TRIP_DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-slate-900">
                {t.label}
              </option>
            ))}
          </select>
          {docType === "otro" && (
            <Input
              placeholder="Nombre del documento"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          )}
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <Button
            type="button"
            variant="outline"
            disabled={uploading || (docType === "otro" && !customLabel.trim())}
            className="border-teal/30 text-teal bg-teal/10 rounded-xl"
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? "Subiendo..." : "Subir archivo (PDF o imagen)"}
            </span>
          </Button>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {notifyOpen && (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Enviar correo al pasajero"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a1628] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-white font-bold text-lg">¿Enviar correo al pasajero?</h4>
                <p className="text-white/50 text-sm mt-1">
                  Avisa al cliente para que entre a Mi cuenta y descargue la documentación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyOpen(false)}
                className="text-white/50 hover:text-white p-1 shrink-0"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {notifyPreview && (
              <>
                <div>
                  <label className="text-white/40 text-xs">Tipo de mensaje</label>
                  <select
                    value={notifyVariant}
                    onChange={(e) => setNotifyVariant(e.target.value as TripDocumentNotifyVariant)}
                    className="mt-1 w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                  >
                    {TRIP_DOCUMENT_NOTIFY_VARIANTS.map((v) => (
                      <option key={v.value} value={v.value} className="bg-slate-900">
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
                  <p className="text-white/40 text-xs">Para: {recipientEmail || "—"}</p>
                  <p className="text-teal font-semibold">{notifyPreview.subject}</p>
                  <p className="text-white/70 leading-relaxed">{notifyPreview.summary}</p>
                  <p className="text-amber-300/80 text-xs pt-2">
                    El correo incluye enlace a Mi cuenta y recuerda que los documentos se pueden descargar hasta{" "}
                    {notifyPreview.retentionDays} días después del fin del viaje.
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNotifyOpen(false)}
                className="border-white/10 text-white bg-white/5"
              >
                Omitir
              </Button>
              <Button
                type="button"
                onClick={() => void sendNotifyEmail()}
                disabled={sendingNotify || !recipientEmail}
                className="bg-teal text-[#070f1a] font-bold"
              >
                <Mail className="h-4 w-4 mr-1" />
                {sendingNotify ? "Enviando..." : "Enviar correo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
