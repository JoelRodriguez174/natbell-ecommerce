"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import CustomerForm from "@/components/checkout/CustomerForm";
import ShippingForm from "@/components/checkout/ShippingForm";
import CartSummary from "@/components/cart/CartSummary";
import Button from "@/components/ui/Button";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_province: "Buenos Aires",
    shipping_postal_code: "",
    notes: "",
  });

  const [shippingQuote, setShippingQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.customer_name.trim()) errs.customer_name = "El nombre es obligatorio";
    if (!formData.customer_email.trim()) errs.customer_email = "El email es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) errs.customer_email = "Formato de email no válido";
    if (!formData.customer_phone.trim()) errs.customer_phone = "El teléfono es obligatorio";
    if (!formData.shipping_address.trim()) errs.shipping_address = "La dirección es obligatoria";
    if (!formData.shipping_city.trim()) errs.shipping_city = "La ciudad es obligatoria";
    if (!formData.shipping_postal_code.trim()) errs.shipping_postal_code = "El código postal es obligatorio";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast("Por favor completa todos los campos obligatorios", "error");
      return;
    }

    if (!items || items.length === 0) {
      addToast("El carrito está vacío", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim(),
        shipping_address: formData.shipping_address.trim(),
        shipping_city: formData.shipping_city.trim(),
        shipping_province: formData.shipping_province.trim(),
        shipping_postal_code: formData.shipping_postal_code.trim(),
        notes: formData.notes.trim() || undefined,
        items: items.map((it) => ({
          product_variant_id: it.variant_id,
          quantity: it.quantity,
        })),
      };

      const res = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      addToast("¡Pedido generado con éxito! Redirigiendo a MercadoPago...", "success");

      // Clear local cart
      clearCart();

      // Redirect to MercadoPago Checkout Pro
      if (res.init_point) {
        window.location.href = res.init_point;
      } else {
        router.push(`/pedido/${res.order_number}`);
      }
    } catch (e) {
      console.error("Order submission error:", e);
      addToast(e.message || "Error al procesar el pedido. Intente nuevamente.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const shippingCost = shippingQuote ? Number(shippingQuote.cost) : 0;
  const grandTotal = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Tu carrito está vacío</h2>
        <p className="text-slate-500 text-sm mt-2">
          Agrega productos a tu carrito antes de iniciar el checkout.
        </p>
        <Link href="/productos" className="mt-6 inline-block">
          <Button variant="primary">Ver Catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href="/carrito"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver al carrito</span>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Finalizar Compra
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Completá tus datos para el envío y el pago seguro con MercadoPago.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck size={16} />
          <span>Checkout Seguro SSL</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Columns */}
          <div className="lg:col-span-8 space-y-6">
            <CustomerForm
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
            />

            <ShippingForm
              data={formData}
              onChange={handleFieldChange}
              onShippingQuoteChange={setShippingQuote}
              errors={errors}
            />

            {/* Optional Notes */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Notas del pedido (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Indicaciones para la entrega o detalles de facturación..."
                value={formData.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 text-slate-800 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <CartSummary
              subtotal={subtotal}
              shippingCost={shippingQuote ? Number(shippingQuote.cost) : null}
              total={grandTotal}
              showCheckoutButton={false}
            />

            <Button
              variant="primary"
              size="lg"
              type="submit"
              loading={submitting}
              className="w-full shadow-lg shadow-rose-600/20"
            >
              <Lock size={18} />
              <span>Confirmar y Pagar en MercadoPago</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
