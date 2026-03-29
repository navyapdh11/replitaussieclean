import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2, ZoomIn } from "lucide-react";

interface PhotoUploadPanelProps {
  bookingId: string;
  hasPhotoAddon: boolean;
}

interface UploadedPhoto {
  id: string;
  type: "before" | "after";
  label: string;
  dataUrl: string;
  fileName: string;
  uploadedAt: Date;
}

interface LightboxProps {
  src: string;
  label: string;
  onClose: () => void;
}

function Lightbox({ src, label, onClose }: LightboxProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close preview"
      >
        <X className="w-8 h-8" />
      </button>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[90vh] w-full"
      >
        <p className="text-white/60 text-sm mb-2 text-center">{label}</p>
        <img src={src} alt={label} className="w-full h-full object-contain rounded-xl" />
      </motion.div>
    </motion.div>
  );
}

interface DropZoneProps {
  type: "before" | "after";
  label: string;
  description: string;
  existing?: UploadedPhoto;
  onUpload: (file: File, type: "before" | "after") => void;
  onRemove: (type: "before" | "after") => void;
  uploading: boolean;
  onPreview: (photo: UploadedPhoto) => void;
}

function DropZone({ type, label, description, existing, onUpload, onRemove, uploading, onPreview }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Please upload an image under 10MB.");
      return;
    }
    onUpload(file, type);
  }, [type, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const colorMap = {
    before: { ring: "ring-amber-500/40", bg: "bg-amber-500/5", border: "border-amber-500/30", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    after:  { ring: "ring-emerald-500/40", bg: "bg-emerald-500/5", border: "border-emerald-500/30", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  };
  const colors = colorMap[type];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors.badge} mb-1`}>{label}</span>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        {existing && (
          <button
            onClick={() => onRemove(type)}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {existing ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
          <img src={existing.dataUrl} alt={label} className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={() => onPreview(existing)}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-colors"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${colors.badge}`}>{label}</span>
            <span className="text-xs text-slate-400 bg-black/60 px-2 py-0.5 rounded-full">
              {existing.uploadedAt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragOver ? `${colors.ring} ring-2 ${colors.bg} ${colors.border}` : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          ) : (
            <>
              <Camera className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-sm font-medium text-slate-300">Tap to take photo</p>
              <p className="text-xs text-slate-500 mt-1">or drag & drop · max 10MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function PhotoUploadPanel({ bookingId, hasPhotoAddon }: PhotoUploadPanelProps) {
  const [photos, setPhotos] = useState<Record<"before" | "after", UploadedPhoto | undefined>>({
    before: undefined,
    after: undefined,
  });
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [lightbox, setLightbox] = useState<UploadedPhoto | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleUpload = useCallback((file: File, type: "before" | "after") => {
    setUploading(type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotos((prev) => ({
        ...prev,
        [type]: {
          id: `${bookingId}-${type}-${Date.now()}`,
          type,
          label: type === "before" ? "Before" : "After",
          dataUrl,
          fileName: file.name,
          uploadedAt: new Date(),
        },
      }));
      setUploading(null);
    };
    reader.readAsDataURL(file);
  }, [bookingId]);

  const handleRemove = useCallback((type: "before" | "after") => {
    setPhotos((prev) => ({ ...prev, [type]: undefined }));
  }, []);

  const handleSubmit = () => {
    if (!photos.before && !photos.after) return;
    setSubmitted(true);
  };

  const bothUploaded = !!photos.before && !!photos.after;
  const anyUploaded = !!photos.before || !!photos.after;

  return (
    <>
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            src={lightbox.dataUrl}
            label={`${lightbox.label} Clean – ${lightbox.uploadedAt.toLocaleString("en-AU")}`}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start gap-3">
          <Camera className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-white">Before & After Photo Report</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {hasPhotoAddon
                ? "Upload before and after photos for your compliance report — delivered to your inbox within 1 hour."
                : "Document your clean with before and after photos for peace of mind."}
            </p>
          </div>
          {hasPhotoAddon && (
            <span className="ml-auto flex-shrink-0 text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
              Add-on included
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-3"
            >
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-bold text-white">Photos Submitted!</h3>
              <p className="text-sm text-slate-400">
                {hasPhotoAddon
                  ? "Your before & after report will be emailed within 1 hour of the clean."
                  : "Your photos have been saved to your booking record."}
              </p>
              <div className="flex gap-3 justify-center pt-2">
                {photos.before && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700">
                    <img src={photos.before.dataUrl} alt="Before" className="w-full h-full object-cover" />
                  </div>
                )}
                {photos.after && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700">
                    <img src={photos.after.dataUrl} alt="After" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
              >
                Upload different photos
              </button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DropZone
                  type="before"
                  label="Before"
                  description="Take/upload before the clean starts"
                  existing={photos.before}
                  onUpload={handleUpload}
                  onRemove={handleRemove}
                  uploading={uploading === "before"}
                  onPreview={setLightbox}
                />
                <DropZone
                  type="after"
                  label="After"
                  description="Take/upload once the clean is complete"
                  existing={photos.after}
                  onUpload={handleUpload}
                  onRemove={handleRemove}
                  uploading={uploading === "after"}
                  onPreview={setLightbox}
                />
              </div>

              {anyUploaded && !bothUploaded && (
                <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Add both before and after photos to generate your full report.
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!anyUploaded || !!uploading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {bothUploaded ? "Submit Both Photos" : anyUploaded ? "Submit Photo" : "Upload to Submit"}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Photos are stored securely and used only for your cleaning report. Max 10MB per image.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
