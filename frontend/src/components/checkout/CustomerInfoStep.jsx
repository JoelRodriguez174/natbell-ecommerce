import { User, Mail, Phone, IdCard } from "lucide-react";

export default function CustomerInfoStep({
  register,
  errors = {},
  formData = {},
  onChange,
}) {
  const getErrorMessage = (field) => {
    const err = errors[field];
    if (!err) return null;
    return typeof err === "string" ? err : err.message;
  };

  const nameProps = register
    ? register("customer_name", { required: "El nombre y apellido es obligatorio" })
    : { value: formData.customer_name || "", onChange };

  const emailProps = register
    ? register("customer_email", {
        required: "El correo electrónico es obligatorio",
        pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: "Ingresá un correo electrónico válido",
        },
      })
    : { value: formData.customer_email || "", onChange };

  const phoneProps = register
    ? register("customer_phone", {
        required: "El teléfono de contacto es obligatorio",
        minLength: {
          value: 8,
          message: "Ingresá un teléfono válido (mínimo 8 dígitos)",
        },
      })
    : { value: formData.customer_phone || "", onChange };

  const dniProps = register
    ? register("customer_dni", {
        required: "El DNI es obligatorio para el envío",
        validate: (value) =>
          /^\d{7,8}$/.test(String(value || "").replace(/\D/g, "")) || "Ingresá un DNI válido (7 u 8 números)",
      })
    : { value: formData.customer_dni || "", onChange };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-[#DE1B76]/10 text-[#DE1B76] flex items-center justify-center font-bold text-sm">
          1
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Datos de Contacto
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="customer_name"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Nombre y Apellido *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="customer_name"
              name="customer_name"
              type="text"
              placeholder="Ej: Laura Rodriguez"
              {...nameProps}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                getErrorMessage("customer_name")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-[#DE1B76] focus:ring-[#DE1B76]/20"
              }`}
            />
          </div>
          {getErrorMessage("customer_name") && (
            <p className="text-xs text-red-500 mt-1">
              {getErrorMessage("customer_name")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="customer_email"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Correo Electrónico *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="customer_email"
              name="customer_email"
              type="email"
              placeholder="Ej: laura@gmail.com"
              {...emailProps}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                getErrorMessage("customer_email")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-[#DE1B76] focus:ring-[#DE1B76]/20"
              }`}
            />
          </div>
          {getErrorMessage("customer_email") && (
            <p className="text-xs text-red-500 mt-1">
              {getErrorMessage("customer_email")}
            </p>
          )}
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
            Te enviaremos el comprobante y el seguimiento de tu compra a este email.
          </span>
        </div>

        <div>
          <label
            htmlFor="customer_phone"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Teléfono de Contacto (WhatsApp) *
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="customer_phone"
              name="customer_phone"
              type="tel"
              placeholder="Ej: 11 4455 6677"
              {...phoneProps}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                getErrorMessage("customer_phone")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-[#DE1B76] focus:ring-[#DE1B76]/20"
              }`}
            />
          </div>
          {getErrorMessage("customer_phone") && (
            <p className="text-xs text-red-500 mt-1">
              {getErrorMessage("customer_phone")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="customer_dni"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            DNI *
          </label>
          <div className="relative">
            <IdCard className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="customer_dni"
              name="customer_dni"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ej: 30123456"
              aria-describedby="customer_dni_help"
              {...dniProps}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-base sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                getErrorMessage("customer_dni")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-[#DE1B76] focus:ring-[#DE1B76]/20"
              }`}
            />
          </div>
          {getErrorMessage("customer_dni") && (
            <p className="text-xs text-red-500 mt-1">
              {getErrorMessage("customer_dni")}
            </p>
          )}
          <span id="customer_dni_help" className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
            Lo pide Andreani para entregar el envío. Si retirás en sucursal, presentá este DNI.
          </span>
        </div>
      </div>
    </div>
  );
}
