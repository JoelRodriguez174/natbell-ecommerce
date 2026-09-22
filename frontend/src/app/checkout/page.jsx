"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useCartStore } from "../../store/useCartStore";
import { getShippingQuote, createOrder, deleteDraftOrder } from "../../lib/api";
import EmptyCheckout from "../../components/checkout/EmptyCheckout";
import CustomerInfoStep from "../../components/checkout/CustomerInfoStep";
import ShippingAddressStep from "../../components/checkout/ShippingAddressStep";
import OrderSummary from "../../components/checkout/OrderSummary";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal } = useCartStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [shippingQuote, setShippingQuote] = useState(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const CHECKOUT_DRAFT_KEY = "natbell_checkout_draft";

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      shipping_address: "",
      shipping_city: "",
      shipping_province: "",
      shipping_postal_code: "",
      notes: "",
    },
  });

  const postalCode = useWatch({ control, name: "shipping_postal_code" });
  const formValues = useWatch({ control });

  // Al montar en cliente, restaurar borrador guardado en localStorage
  useEffect(() => {
    setHasMounted(true);
    try {
      const saved = localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, val]) => {
          if (val) setValue(key, val, { shouldValidate: true });
        });
      }
    } catch (err) {
      console.warn("No se pudo cargar el borrador de compra:", err);
    }
  }, [setValue]);

  // Persistir cambios del formulario en localStorage en tiempo real
  useEffect(() => {
    if (!hasMounted) return;
    try {
      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(formValues));
    } catch (err) {
      // ignore
    }
  }, [formValues, hasMounted]);

  const handleQuotePostalCode = async (cp) => {
    if (!cp || cp.trim().length < 4) {
      setShippingQuote(null);
      setQuoteError(null);
      return;
    }
    setIsQuoting(true);
    setQuoteError(null);
    try {
      const quote = await getShippingQuote(cp.trim());
      setShippingQuote(quote);
      setQuoteError(null);
    } catch (err) {
      setShippingQuote(null);
      setQuoteError(
        err.message || "No encontramos tarifas de entrega para este código postal"
      );
    } finally {
      setIsQuoting(false);
    }
  };

  // Refetch reactivo con debounce al tipear el código postal (sin necesidad de apretar botones)
  useEffect(() => {
    if (!postalCode) {
      setShippingQuote(null);
      setQuoteError(null);
      return;
    }

    const trimmed = postalCode.trim().toUpperCase();
    const numericMatch = trimmed.match(/\d+/g);
    const digitsCount = numericMatch ? numericMatch.join("").length : 0;

    // Código postal argentino: 4 dígitos o formato CPA
    if (digitsCount === 4 && /^[A-Z]?\d{4}[A-Z]{0,3}$/i.test(trimmed)) {
      const debounceTimer = setTimeout(() => {
        handleQuotePostalCode(trimmed);
      }, 400);
      return () => clearTimeout(debounceTimer);
    } else {
      setShippingQuote(null);
      if (digitsCount > 4) {
        setQuoteError("El código postal argentino consta de 4 números.");
      } else {
        setQuoteError(null);
      }
    }
  }, [postalCode]);

  const onSubmit = async (data) => {
    setSubmitError(null);

    try {
      // Si el cliente reintenta la compra generando una nueva orden, descartar el intento anterior no pagado
      if (typeof window !== "undefined") {
        const prevPending = sessionStorage.getItem("natbell_pending_order");
        if (prevPending) {
          deleteDraftOrder(prevPending);
          sessionStorage.removeItem("natbell_pending_order");
        }
      }

      const orderItems = items.map((item) => ({
        product_variant_id: item.variantId || item.id,
        quantity: item.quantity,
      }));

      const payload = {
        customer_name: data.customer_name.trim(),
        customer_email: data.customer_email.trim(),
        customer_phone: data.customer_phone.trim(),
        shipping_address: data.shipping_address.trim(),
        shipping_city: data.shipping_city.trim(),
        shipping_province: data.shipping_province.trim(),
        shipping_postal_code: data.shipping_postal_code.trim(),
        shipping_cost: shippingQuote?.cost ? Number(shippingQuote.cost) : 0,
        notes: data.notes?.trim() || null,
        items: orderItems,
      };

      const response = await createOrder(payload);

      if (response && response.checkout_url) {
        if (response.order_number && typeof window !== "undefined") {
          sessionStorage.setItem("natbell_pending_order", response.order_number);
        }
        // Redirección inmediata a Mercado Pago Checkout Pro o Simulador sin vaciar carrito
        // El carrito solo se limpia cuando se concreta la compra en /pago/exitoso
        window.location.assign(response.checkout_url);
      } else {
        throw new Error("No se recibió la URL de pago de la pasarela.");
      }
    } catch (err) {
      console.error("Error al procesar la orden:", err);
      setSubmitError(err.message || "Ocurrió un error al procesar tu compra. Por favor, verificá tus datos.");
      window.scrollTo({ top: 100, behavior: "smooth" });
    }
  };

  // Esperar montaje en cliente para hidratar estado de Zustand
  if (!hasMounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // REGLA CRÍTICA DE UX: Si el carrito está vacío, NO redirigir. Mostrar EmptyCheckout.
  if (items.length === 0) {
    return <EmptyCheckout />;
  }

  const subtotal = getSubtotal();
  const shippingCost = shippingQuote?.cost ? Number(shippingQuote.cost) : 0;
  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado con navegación de regreso */}
        <div className="mb-8">
          <Link
            href="/carrito"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al carrito</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Finalizar Compra en Natbell
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Completá tus datos de envío y aboná de forma segura con Mercado Pago.
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Formulario y Resumen */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <CustomerInfoStep
                register={register}
                errors={errors}
              />

              <ShippingAddressStep
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                postalCodeValue={postalCode}
                shippingQuote={shippingQuote}
                isQuoting={isQuoting}
                quoteError={quoteError}
                onQuotePostalCode={handleQuotePostalCode}
              />
            </div>

            <div className="lg:col-span-5">
              <OrderSummary
                items={items}
                subtotal={subtotal}
                shippingCost={shippingCost}
                total={total}
                isLoading={isSubmitting}
                onSubmit={handleSubmit(onSubmit)}
              />

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("¿Seguro que deseás cancelar tu compra y vaciar el carrito?")) {
                      useCartStore.getState().clearCart();
                      try {
                        localStorage.removeItem(CHECKOUT_DRAFT_KEY);
                      } catch (e) {
                        // ignore
                      }
                      router.push("/productos");
                    }
                  }}
                  className="text-xs text-zinc-400 hover:text-red-500 underline transition-colors cursor-pointer"
                >
                  Cancelar compra y vaciar carrito
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
