"use client";

import React from "react";
import { User, Mail, Phone } from "lucide-react";
import Input from "../ui/Input";

export default function CustomerForm({ data, onChange, errors = {} }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">
          1
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Datos de Contacto</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Nombre y Apellido"
            placeholder="Ej: Laura Pérez"
            icon={User}
            required
            value={data.customer_name}
            onChange={(e) => onChange("customer_name", e.target.value)}
            error={errors.customer_name}
          />
        </div>

        <div>
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="laura@ejemplo.com"
            icon={Mail}
            required
            value={data.customer_email}
            onChange={(e) => onChange("customer_email", e.target.value)}
            error={errors.customer_email}
          />
        </div>

        <div>
          <Input
            label="Teléfono / WhatsApp"
            type="tel"
            placeholder="Ej: 11 4455 6677"
            icon={Phone}
            required
            value={data.customer_phone}
            onChange={(e) => onChange("customer_phone", e.target.value)}
            error={errors.customer_phone}
          />
        </div>
      </div>
    </div>
  );
}
