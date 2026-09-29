"use client";

import { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { downloadImportTemplate, importProductsFile } from "../../../lib/api";

export default function ProductImportModal({
  isOpen,
  onClose,
  token,
  onImportSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "csv", "xls"].includes(ext)) {
      setErrorMessage("Por favor seleccioná un archivo de Excel (.xlsx) o CSV (.csv).");
      setSelectedFile(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleDownload = async (format) => {
    setIsDownloading(true);
    try {
      await downloadImportTemplate(format, token);
    } catch (err) {
      setErrorMessage(err.message || "Error al descargar la plantilla.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrorMessage("Debes seleccionar un archivo primero.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setImportResult(null);

    try {
      const result = await importProductsFile(selectedFile, token);
      setImportResult(result);
      if (result.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || "Ocurrió un error al procesar el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              <span>Importación Masiva de Productos</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cargá múltiples productos y variantes rápidamente usando planillas Excel o CSV.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Paso 1: Descargar Plantilla */}
          <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Paso 1: Descargar Plantilla Oficial
              </span>
              <span className="text-[11px] text-zinc-400">Columnas preconfiguradas con ejemplos</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Completá tus productos siguiendo el formato sugerido para evitar errores de categorización o SKU.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownload("xlsx")}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Plantilla Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload("csv")}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>Plantilla CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Paso 2: Subir Archivo */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Paso 2: Subir Planilla Completada
            </span>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                selectedFile
                  ? "border-amber-500 bg-amber-50/30 dark:bg-amber-950/10"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500 bg-zinc-50/50 dark:bg-zinc-900/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .csv, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Clic para cambiar de archivo
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Hacé clic o arrastrá tu planilla acá
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Soporta archivos Excel (.xlsx) o delimitados por coma (.csv) de hasta 10 MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mensajes de Error */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Resumen de Resultados tras la Importación */}
          {importResult && (
            <div className="space-y-3 pt-2">
              <div
                className={`p-4 rounded-2xl border ${
                  importResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <h3
                    className={`font-bold text-sm ${
                      importResult.success
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-red-800 dark:text-red-200"
                    }`}
                  >
                    {importResult.success
                      ? "¡Importación completada con éxito!"
                      : "La importación no pudo completarse"}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      {importResult.products_created}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">Productos Nuevos</p>
                  </div>
                  <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      {importResult.variants_created}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">Variantes / SKUs</p>
                  </div>
                  <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      {importResult.total_rows_processed}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">Filas Leídas</p>
                  </div>
                </div>
              </div>

              {/* Advertencias */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-200 space-y-1 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Observaciones ({importResult.warnings.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {importResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errores */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200 space-y-1 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span>Errores detectados ({importResult.errors.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {importResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
          {importResult ? (
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Listo, Cerrar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando archivo...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Iniciar Importación</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
