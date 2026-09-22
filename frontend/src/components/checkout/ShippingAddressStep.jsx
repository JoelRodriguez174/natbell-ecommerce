import { useState, useEffect } from "react";
import { MapPin, CheckCircle2, AlertCircle, Building2, Compass, Home } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import {
  ARGENTINA_PROVINCES,
  ARGENTINA_CITIES_BY_PROVINCE,
  getDefaultPostalCode,
} from "../../lib/argentinaLocations";
import DeliveryTypeSelector from "./DeliveryTypeSelector";

export default function ShippingAddressStep({
  register,
  errors = {},
  formData = {},
  onChange,
  watch,
  setValue,
  postalCodeValue = "",
  shippingQuote = null,
  isQuoting = false,
  quoteError = null,
  onQuotePostalCode = () => {},
}) {
  const isInitialBranch = Boolean(
    formData.shipping_address?.startsWith("Retiro en Sucursal") ||
    (watch && watch("shipping_address")?.startsWith("Retiro en Sucursal"))
  );

  const [deliveryType, setDeliveryType] = useState(isInitialBranch ? "branch" : "home");
  const [homeAddress, setHomeAddress] = useState(
    isInitialBranch ? "" : (formData.shipping_address || "")
  );
  const [selectedProvince, setSelectedProvince] = useState(
    formData.shipping_province || ""
  );
  const [selectedCityOption, setSelectedCityOption] = useState(
    formData.shipping_city || ""
  );
  const [customCity, setCustomCity] = useState("");
  const [cpWarning, setCpWarning] = useState(null);

  const watchedAddress = watch ? watch("shipping_address") : null;
  const watchedProvince = watch ? watch("shipping_province") : null;
  const watchedCity = watch ? watch("shipping_city") : null;

  const getBranchAddress = (prov, city, custom = customCity) => {
    const effectiveCity = city === "OTRA" ? custom : city;
    const loc = effectiveCity || prov;
    return loc ? `Retiro en Sucursal Andreani - ${loc}` : "Retiro en Sucursal Andreani";
  };

  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    if (type === "home") {
      if (setValue) {
        setValue("shipping_address", homeAddress, { shouldValidate: Boolean(homeAddress) });
      }
      if (onChange) {
        onChange({ target: { name: "shipping_address", value: homeAddress } });
      }
    } else {
      const branchAddr = getBranchAddress(selectedProvince, selectedCityOption);
      if (setValue) {
        setValue("shipping_address", branchAddr, { shouldValidate: true });
      }
      if (onChange) {
        onChange({ target: { name: "shipping_address", value: branchAddr } });
      }
    }
  };

  const handleHomeAddressChange = (e) => {
    const val = e.target.value;
    setHomeAddress(val);
    if (setValue) {
      setValue("shipping_address", val, { shouldValidate: true });
    }
    if (onChange) {
      onChange(e);
    }
  };

  // Sincronizar con watch de React Hook Form si está disponible (útil para restaurar draft)
  useEffect(() => {
    if (watchedProvince !== null && watchedProvince !== undefined) {
      setSelectedProvince(watchedProvince);
    }
  }, [watchedProvince]);

  useEffect(() => {
    if (watchedAddress?.startsWith("Retiro en Sucursal")) {
      setDeliveryType("branch");
    } else if (watchedAddress) {
      setHomeAddress((prev) => prev || watchedAddress);
    }
  }, [watchedAddress]);

  const availableCities = selectedProvince
    ? ARGENTINA_CITIES_BY_PROVINCE[selectedProvince] || []
    : [];

  const handleProvinceChange = (e) => {
    const prov = e.target.value;
    setSelectedProvince(prov);
    setSelectedCityOption("");
    setCustomCity("");

    if (setValue) {
      setValue("shipping_province", prov, { shouldValidate: true });
      setValue("shipping_city", "", { shouldValidate: true });
      if (deliveryType === "branch") {
        setValue("shipping_address", getBranchAddress(prov, ""), { shouldValidate: true });
      }
    }
    if (onChange) {
      onChange({ target: { name: "shipping_province", value: prov } });
      onChange({ target: { name: "shipping_city", value: "" } });
      if (deliveryType === "branch") {
        onChange({ target: { name: "shipping_address", value: getBranchAddress(prov, "") } });
      }
    }
  };

  const handleCitySelectChange = (e) => {
    const val = e.target.value;
    setSelectedCityOption(val);

    if (val !== "OTRA") {
      setCustomCity("");
      if (setValue) {
        setValue("shipping_city", val, { shouldValidate: true });
        if (deliveryType === "branch") {
          setValue("shipping_address", getBranchAddress(selectedProvince, val), { shouldValidate: true });
        }
      }
      if (onChange) {
        onChange({ target: { name: "shipping_city", value: val } });
        if (deliveryType === "branch") {
          onChange({ target: { name: "shipping_address", value: getBranchAddress(selectedProvince, val) } });
        }
      }

      // Autocompletar el Código Postal predefinido para la ciudad y disparar cotización
      const defaultCp = getDefaultPostalCode(selectedProvince, val);
      if (defaultCp) {
        setCpWarning(null);
        if (setValue) {
          setValue("shipping_postal_code", defaultCp, { shouldValidate: true });
        }
        if (onChange) {
          onChange({ target: { name: "shipping_postal_code", value: defaultCp } });
        }
        onQuotePostalCode(defaultCp);
      }
    } else {
      if (setValue) {
        setValue("shipping_city", customCity, { shouldValidate: true });
      }
      if (onChange) {
        onChange({ target: { name: "shipping_city", value: customCity } });
      }
    }
  };

  const handleCustomCityChange = (e) => {
    const val = e.target.value;
    setCustomCity(val);
    if (setValue) {
      setValue("shipping_city", val, { shouldValidate: true });
      if (deliveryType === "branch") {
        setValue("shipping_address", getBranchAddress(selectedProvince, "OTRA", val), { shouldValidate: true });
      }
    }
    if (onChange) {
      onChange({ target: { name: "shipping_city", value: val } });
      if (deliveryType === "branch") {
        onChange({ target: { name: "shipping_address", value: getBranchAddress(selectedProvince, "OTRA", val) } });
      }
    }
  };

  const handlePostalCodeChange = (e) => {
    const rawVal = e.target.value.trim().toUpperCase();

    // Validar formato del CP argentino (4 dígitos o CPA de 8 caracteres tipo C1414CAB)
    const numericMatch = rawVal.match(/\d+/g);
    const digitsCount = numericMatch ? numericMatch.join("").length : 0;

    if (digitsCount > 4) {
      setCpWarning(
        "El código postal argentino consta de 4 números (ej: 1414 o C1414CAB). Verificá no haber puesto dígitos de más."
      );
    } else if (rawVal && !/^[A-Z]?\d{0,4}[A-Z]{0,3}$/i.test(rawVal)) {
      setCpWarning("Formato de código postal no válido (ej: 1414 o C1414CAB).");
    } else {
      setCpWarning(null);
    }

    if (setValue) {
      setValue("shipping_postal_code", rawVal, { shouldValidate: true });
    }
    if (onChange) {
      onChange(e);
    }

    // Si tiene exactamente 4 dígitos o formato CPA válido, cotizar
    if (digitsCount === 4 && (!numericMatch || digitsCount <= 4)) {
      onQuotePostalCode(rawVal);
    }
  };

  const getErrorMessage = (field) => {
    const err = errors[field];
    if (!err) return null;
    return typeof err === "string" ? err : err.message;
  };

  const currentCP =
    postalCodeValue ||
    (watch ? watch("shipping_postal_code") : formData.shipping_postal_code) ||
    "";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-[#5EB82D]/10 text-[#5EB82D] flex items-center justify-center font-bold text-sm">
          2
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Domicilio y Envío
        </h3>
      </div>

      <div className="space-y-4">
        {/* Selector de Modalidad: Envío a Domicilio o Retiro en Sucursal */}
        <DeliveryTypeSelector
          deliveryType={deliveryType}
          onSelectDeliveryType={handleDeliveryTypeChange}
        />

        {/* Input oculto para validación de react-hook-form de shipping_address */}
        {register && (
          <input
            type="hidden"
            {...register("shipping_address", {
              validate: (val) => {
                if (deliveryType === "home" && (!val || !val.trim())) {
                  return "La dirección de entrega es obligatoria para envíos a domicilio";
                }
                return true;
              },
            })}
          />
        )}

        {/* Dirección si es Domicilio, o Info de Sucursal si es Retiro */}
        {deliveryType === "home" ? (
          <div className="animate-in fade-in duration-150">
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
                value={homeAddress}
                onChange={handleHomeAddressChange}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                  getErrorMessage("shipping_address")
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-zinc-200 dark:border-zinc-700 focus:border-[#DE1B76] focus:ring-[#DE1B76]/20"
                }`}
              />
            </div>
            {getErrorMessage("shipping_address") && (
              <p className="text-xs text-red-500 mt-1">
                {getErrorMessage("shipping_address")}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-sm text-[#DE1B76]">
              <Building2 className="w-4 h-4" />
              <span>Retiro en Sucursal Andreani Oficial</span>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Tu paquete será enviado a la <strong>sucursal oficial de Andreani</strong> correspondiente a{" "}
              <strong>{selectedCityOption && selectedCityOption !== "OTRA" ? selectedCityOption : (selectedProvince || "tu localidad")}</strong>
              {currentCP ? <> (CP <strong>{currentCP}</strong>)</> : null}.
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              No es necesario indicar tu domicilio particular. Al despachar la compra te notificaremos automáticamente por email con tu código de seguimiento oficial de Andreani para retirar con tu DNI.
            </p>
          </div>
        )}

        {/* Dropdowns en cascada: Primero Provincia, luego Ciudad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Selector de Provincia */}
          <div>
            <label
              htmlFor="shipping_province"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              1. Provincia *
            </label>
            <div className="relative">
              <Compass className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="shipping_province"
                name="shipping_province"
                value={selectedProvince}
                onChange={handleProvinceChange}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                  getErrorMessage("shipping_province")
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-zinc-200 dark:border-zinc-700 focus:border-[#DE1B76] focus:ring-[#DE1B76]/20"
                }`}
              >
                <option value="">Seleccioná tu provincia</option>
                {ARGENTINA_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
            {/* Input oculto para que react-hook-form mantenga la validación requerida */}
            {register && (
              <input
                type="hidden"
                {...register("shipping_province", {
                  required: "La provincia es obligatoria",
                })}
              />
            )}
            {getErrorMessage("shipping_province") && (
              <p className="text-xs text-red-500 mt-1">
                {getErrorMessage("shipping_province")}
              </p>
            )}
          </div>

          {/* 2. Selector de Ciudad / Localidad dependiente */}
          <div>
            <label
              htmlFor="shipping_city_select"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              2. Ciudad / Localidad *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="shipping_city_select"
                disabled={!selectedProvince}
                value={selectedCityOption}
                onChange={handleCitySelectChange}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  getErrorMessage("shipping_city")
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-zinc-200 dark:border-zinc-700 focus:border-[#DE1B76] focus:ring-[#DE1B76]/20"
                }`}
              >
                <option value="">
                  {selectedProvince
                    ? "Seleccioná tu ciudad / localidad"
                    : "Primero elegí una provincia"}
                </option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
                {selectedProvince && (
                  <option value="OTRA">Otra localidad...</option>
                )}
              </select>
            </div>

            {/* Si elige "Otra localidad...", mostrar input de texto libre */}
            {selectedCityOption === "OTRA" && (
              <div className="mt-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Escribí tu localidad o barrio"
                  value={customCity}
                  onChange={handleCustomCityChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-[#DE1B76] focus:ring-2 focus:ring-[#DE1B76]/20 transition-all"
                />
              </div>
            )}

            {register && (
              <input
                type="hidden"
                {...register("shipping_city", {
                  required: "La ciudad o localidad es obligatoria",
                })}
              />
            )}
            {getErrorMessage("shipping_city") && (
              <p className="text-xs text-red-500 mt-1">
                {getErrorMessage("shipping_city")}
              </p>
            )}
          </div>
        </div>

        {/* Código Postal con Validación y Alerta */}
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <label
              htmlFor="shipping_postal_code"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Código Postal * (4 dígitos)
            </label>
            {selectedCityOption && selectedCityOption !== "OTRA" && (
              <span className="text-[11px] text-[#5EB82D] font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>CP sugerido para {selectedCityOption}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="shipping_postal_code"
              name="shipping_postal_code"
              type="text"
              maxLength={8}
              placeholder="Ej: 1414 o C1414CAB"
              value={currentCP}
              onChange={handlePostalCodeChange}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                cpWarning || getErrorMessage("shipping_postal_code")
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700 focus:border-[#DE1B76] focus:ring-[#DE1B76]/20"
              }`}
            />
            <button
              type="button"
              onClick={() => onQuotePostalCode(currentCP)}
              disabled={isQuoting || !currentCP || Boolean(cpWarning)}
              className="px-4 py-2.5 rounded-xl bg-[#DE1B76] hover:bg-[#c21464] text-white text-xs font-bold transition-all shadow-sm shadow-[#DE1B76]/20 disabled:opacity-50 shrink-0 cursor-pointer border-none"
            >
              {isQuoting ? "Cotizando..." : "Cotizar"}
            </button>
          </div>

          {/* Alerta de CP inválido o > 4 dígitos */}
          {cpWarning && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#DE1B76] font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{cpWarning}</span>
            </div>
          )}

          {getErrorMessage("shipping_postal_code") && !cpWarning && (
            <p className="text-xs text-red-500 mt-1">
              {getErrorMessage("shipping_postal_code")}
            </p>
          )}

          {/* Error reactivo de cotización (sin cobertura o no encontrado) */}
          {quoteError && !cpWarning && (
            <div className="mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{quoteError}</span>
            </div>
          )}

          {/* Cotización calculada exitosa */}
          {shippingQuote && (
            <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{shippingQuote.zone_name}:</strong>{" "}
                  {shippingQuote.description} (~{shippingQuote.estimated_days} días hábiles)
                </span>
              </div>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 ml-2 whitespace-nowrap text-sm">
                {formatPrice(shippingQuote.cost)}
              </span>
            </div>
          )}
        </div>

        {/* Notas adicionales */}
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
            {...(register
              ? register("notes")
              : { value: formData.notes || "", onChange })}
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:border-[#DE1B76] focus:ring-2 focus:ring-[#DE1B76]/20 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
