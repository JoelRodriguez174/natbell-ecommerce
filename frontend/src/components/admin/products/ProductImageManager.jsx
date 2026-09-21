"use client";

import { Upload, X, Loader2, Plus } from "lucide-react";

export default function ProductImageManager({
  images,
  onRemoveImage,
  onAddImageUrl,
  urlInput,
  onUrlInputChange,
  onFileUpload,
  isUploading,
  uploadingPreview,
}) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Galería de Imágenes
      </label>

      {/* Previsualización de imágenes existentes */}
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
          {images.map((imgUrl, idx) => (
            <div
              key={`${imgUrl}-${idx}`}
              className="relative group w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow"
                title="Eliminar foto"
              >
                <X className="w-3 h-3" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-zinc-950 font-bold text-[9px] text-center py-0.5 uppercase tracking-wider">
                  Portada
                </span>
              )}
            </div>
          ))}

          {/* Miniatura transitoria mientras sube */}
          {isUploading && uploadingPreview && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-amber-500 bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadingPreview}
                alt="Subiendo..."
                className="w-full h-full object-cover opacity-50"
              />
              <Loader2 className="w-5 h-5 animate-spin text-amber-500 absolute" />
            </div>
          )}
        </div>
      ) : isUploading && uploadingPreview ? (
        <div className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-amber-500 bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadingPreview}
              alt="Subiendo..."
              className="w-full h-full object-cover opacity-50"
            />
            <Loader2 className="w-5 h-5 animate-spin text-amber-500 absolute" />
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-zinc-400 italic">
          No hay imágenes asignadas a este producto aún.
        </p>
      )}

      {/* Controles de Carga: Archivo local o URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Subida de archivo */}
        <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-amber-500/5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors font-medium">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Subiendo archivo...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-zinc-400" />
              <span>Subir archivo local</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={onFileUpload}
            className="hidden"
          />
        </label>

        {/* Input de URL externa */}
        <div className="flex gap-1.5">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => onUrlInputChange(e.target.value)}
            placeholder="Pegar URL (https://...)"
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={onAddImageUrl}
            className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-amber-500 hover:text-zinc-950 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
            title="Agregar foto por URL"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
