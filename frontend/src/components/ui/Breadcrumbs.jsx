"use client";

import { Breadcrumbs as HeroBreadcrumbs, BreadcrumbsItem } from "@heroui/react";
import { Home } from "lucide-react";

export default function Breadcrumbs({ items = [], className = "" }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Ruta de navegación"
      className={`w-full overflow-x-auto no-scrollbar scroll-smooth py-2 -my-1 ${className}`}
    >
      <HeroBreadcrumbs
        size="sm"
        className="flex-nowrap min-w-max"
        itemClasses={{
          item: "text-xs text-gray-500 data-[current=true]:text-gray-900 data-[current=true]:font-semibold hover:text-black transition-colors whitespace-nowrap",
          separator: "text-gray-400 px-1 shrink-0",
        }}
      >
        <BreadcrumbsItem href="/" className="flex items-center gap-1 shrink-0">
          <Home className="w-3.5 h-3.5 shrink-0" />
          <span>Inicio</span>
        </BreadcrumbsItem>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <BreadcrumbsItem
              key={item.href || index}
              href={!isLast ? item.href : undefined}
              isCurrent={isLast}
              className="shrink-0"
            >
              <span
                className={
                  isLast
                    ? "max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-none truncate inline-block align-bottom"
                    : "max-w-[140px] sm:max-w-none truncate inline-block align-bottom"
                }
                title={item.label}
              >
                {item.label}
              </span>
            </BreadcrumbsItem>
          );
        })}
      </HeroBreadcrumbs>
    </nav>
  );
}
