import { MapPin, CheckCircle2 } from "lucide-react";
import { formatPrice } from "../../lib/utils";

export default function ShippingAddressStep({
  register,
  errors = {},
  formData = {},
  onChange,
  postalCodeValue = "",
  shippingQuote = null,
  isQuoting = false,
  onQuotePostalCode = () => {},
}) {
  const getErrorMessage = (field) => {
    const err = errors[field];
    if (!err) return null;
    return typeof err === "string" ? err : err.message;
  };

  const addressProps = register
    ? register("shipping_address", { required: "La dirección de entrega es obligatoria" })
    : { value: formData.shipping_address || "", onChange };

  const cityProps = register
    ? register("shipping_city", { required: "La ciudad o localidad es obligatoria" })
    : { value: formData.shipping_city || "", onChange };

  const provinceProps = register
    ? register("shipping_province", { required: "La provincia es obligatoria" })
    : { value: formData.shipping_province || "", onChange };

  const postalCodeProps = register
    ? register("shipping_postal_code", {
        required: "El código postal es obligatorio",
        minLength: {
          value: 4,
          message: "Ingresá al menos 4 caracteres",
        },
        onChange: (e) => {
          const val = e.target.value.trim();
          if (val.length >= 4) {
            onQuotePostalCode(val);
          }
        },
      })
    : {
        value: formData.shipping_postal_code || "",
        onChange: (e) => {
          if (onChange) onChange(e);
          if (e.target.value.trim().length >= 4) {
            onQuotePostalCode(e.target.value.trim());
          }
        },
      };

  const notesProps = register
    ? register("notes")
    : { value: formData.notes || "", onChange };

  const currentCP = postalCodeValue || formData.shipping_postal_code || "";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-semibold text-sm">
          2
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Domicilio y Envío
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="shipping_address"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Calle y Número (Piso / Depto) *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="shipping_address"
              name="shipping_address"
              type="text"
              placeholder="Ej: Av. Santa Fe 1234, Piso 4 B"
              {...addressProps}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                getErrorMessage("shipping_address")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20"
              }`}
            />
          </div>
          {getErrorMessage("shipping_address") && (
            <p className="text-xs text-red-500 mt-1">
              {getErrorMessage("shipping_address")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="shipping_city"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Ciudad / Localidad *
            </label>
            <input
              id="shipping_city"
              name="shipping_city"
              type="text"
              placeholder="Ej: Mar del Plata"
              {...cityProps}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                getErrorMessage("shipping_city")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20"
              }`}
            />
            {getErrorMessage("shipping_city") && (
              <p className="text-xs text-red-500 mt-1">
                {getErrorMessage("shipping_city")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="shipping_province"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Provincia *
            </label>
            <input
              id="shipping_province"
              name="shipping_province"
              type="text"
              placeholder="Ej: Buenos Aires"
              {...provinceProps}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                getErrorMessage("shipping_province")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20"
              }`}
            />
            {getErrorMessage("shipping_province") && (
              <p className="text-xs text-red-500 mt-1">
                {getErrorMessage("shipping_province")}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="shipping_postal_code"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Código Postal *
          </label>
          <div className="flex gap-2">
            <input
              id="shipping_postal_code"
              name="shipping_postal_code"
              type="text"
              placeholder="Ej: 1425"
              {...postalCodeProps}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                getErrorMessage("shipping_postal_code")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20"
              }`}
            />
            <button
              type="button"
              onClick={() => onQuotePostalCode(currentCP)}
              disabled={isQuoting || !currentCP}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
            >
              {isQuoting ? "Cotizando..." : "Cotizar"}
            </button>
          </div>
          {getErrorMessage("shipping_postal_code") && (
            <p className="text-xs text-red-500 mt-1">
              {getErrorMessage("shipping_postal_code")}
            </p>
          )}

          {shippingQuote && (
            <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{shippingQuote.zone_name}:</strong> {shippingQuote.description} (~{shippingQuote.estimated_days} días hábiles)
                </span>
              </div>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 ml-2 whitespace-nowrap">
                {formatPrice(shippingQuote.cost)}
              </span>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Notas adicionales para la entrega (Opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="2"
            placeholder="Ej: Timbre no funciona, dejar con encargado o vecino..."
            {...notesProps}
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
