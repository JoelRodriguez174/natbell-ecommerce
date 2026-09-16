"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { getShippingQuote, createOrder } from "../../lib/api";
import EmptyCheckout from "../../components/checkout/EmptyCheckout";
import CustomerInfoStep from "../../components/checkout/CustomerInfoStep";
import ShippingAddressStep from "../../components/checkout/ShippingAddressStep";
import OrderSummary from "../../components/checkout/OrderSummary";

export default function CheckoutPage() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const [hasMounted, setHasMounted] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_province: "",
    shipping_postal_code: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [shippingQuote, setShippingQuote] = useState(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleQuotePostalCode = async (cp) => {
    if (!cp || cp.length < 4) return;
    setIsQuoting(true);
    try {
      const quote = await getShippingQuote(cp);
      setShippingQuote(quote);
    } catch (err) {
      console.warn("No se pudo obtener cotización automática para el CP:", err.message);
    } finally {
      setIsQuoting(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = "El nombre es obligatorio.";
    if (!formData.customer_email.trim()) {
      newErrors.customer_email = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = "Ingresá un correo electrónico válido.";
    }
    if (!formData.customer_phone.trim()) newErrors.customer_phone = "El teléfono es obligatorio.";
    if (!formData.shipping_address.trim()) newErrors.shipping_address = "La dirección es obligatoria.";
    if (!formData.shipping_city.trim()) newErrors.shipping_city = "La ciudad es obligatoria.";
    if (!formData.shipping_province.trim()) newErrors.shipping_province = "La provincia es obligatoria.";
    if (!formData.shipping_postal_code.trim()) newErrors.shipping_postal_code = "El código postal es obligatorio.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderItems = items.map((item) => ({
        product_variant_id: item.variantId || item.id,
        quantity: item.quantity,
      }));

      const payload = {
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim(),
        shipping_address: formData.shipping_address.trim(),
        shipping_city: formData.shipping_city.trim(),
        shipping_province: formData.shipping_province.trim(),
        shipping_postal_code: formData.shipping_postal_code.trim(),
        shipping_cost: shippingQuote?.cost ? Number(shippingQuote.cost) : 0,
        notes: formData.notes?.trim() || null,
        items: orderItems,
      };

      const response = await createOrder(payload);

      if (response && response.checkout_url) {
        clearCart();
        // Redirección inmediata a Mercado Pago Checkout Pro o Simulador
        window.location.href = response.checkout_url;
      } else {
        throw new Error("No se recibió la URL de pago de la pasarela.");
      }
    } catch (err) {
      console.error("Error al procesar la orden:", err);
      setSubmitError(err.message || "Ocurrió un error al procesar tu compra. Por favor, verificá tus datos.");
      setIsSubmitting(false);
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

        {/* Grilla principal: Formulario 2 pasos + Resumen sticky */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <CustomerInfoStep
              formData={formData}
              onChange={handleInputChange}
              errors={errors}
            />

            <ShippingAddressStep
              formData={formData}
              onChange={handleInputChange}
              errors={errors}
              shippingQuote={shippingQuote}
              isQuoting={isQuoting}
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
              onSubmit={handleSubmitOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
