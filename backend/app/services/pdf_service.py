import base64
import io
import json
import logging
from datetime import datetime, timedelta
from typing import Any

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.config import settings

logger = logging.getLogger("natbell.pdf")


class PDFService:
    """Servicio de generación de Factura C oficial y comprobantes en PDF."""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self) -> None:
        """Inicializa estilos tipográficos con proporciones limpias y accesibles."""
        self.title_style = ParagraphStyle(
            "InvoiceTitle",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            textColor=colors.HexColor("#18181b"),
        )
        self.header_label = ParagraphStyle(
            "HeaderLabel",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#27272a"),
        )
        self.header_value = ParagraphStyle(
            "HeaderValue",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#3f3f46"),
        )
        self.header_company = ParagraphStyle(
            "CompanyTitle",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=14,
            textColor=colors.HexColor("#18181b"),
        )
        self.table_header = ParagraphStyle(
            "TableHeader",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9,
            alignment=1,  # Center
            textColor=colors.HexColor("#18181b"),
        )
        self.cell_text = ParagraphStyle(
            "CellText",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#27272a"),
        )
        self.cell_text_bold = ParagraphStyle(
            "CellTextBold",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#18181b"),
        )
        self.cell_text_right = ParagraphStyle(
            "CellTextRight",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9.5,
            alignment=2,  # Right
            textColor=colors.HexColor("#27272a"),
        )
        self.cell_text_right_bold = ParagraphStyle(
            "CellTextRightBold",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            alignment=2,  # Right
            textColor=colors.HexColor("#18181b"),
        )
        self.footer_small = ParagraphStyle(
            "FooterSmall",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=7,
            leading=8.5,
            textColor=colors.HexColor("#52525b"),
        )
        self.footer_bold = ParagraphStyle(
            "FooterBold",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#18181b"),
        )

    def _format_currency(self, value: Any) -> str:
        """Formatea número decimal en formato de moneda ARS ($ 1.234,56)."""
        try:
            val = float(value or 0)
            return f"${val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        except (ValueError, TypeError):
            return "$0,00"

    def _generate_afip_qr(
        self,
        cuit: str,
        pto_vta: int,
        nro_cmp: int,
        total: float,
        fecha: str,
        cae: str,
        doc_nro: str,
    ) -> io.BytesIO:
        """Genera el código QR reglamentario oficial de AFIP según la RG 4291."""
        qr_payload = {
            "ver": 1,
            "fecha": fecha,
            "cuit": int(cuit) if cuit.isdigit() else 20246728918,
            "ptoVta": pto_vta,
            "tipoCmp": 11,  # 11 = Factura C
            "nroCmp": nro_cmp,
            "importe": round(total, 2),
            "moneda": "PES",
            "ctz": 1,
            "tipoDocRec": 96 if doc_nro and doc_nro.isdigit() else 99,  # 96=DNI, 99=Consumidor Final
            "nroDocRec": int(doc_nro) if doc_nro and doc_nro.isdigit() else 0,
            "tipoCodAut": "E",
            "codAut": int(cae) if cae.isdigit() else 74389218392182,
        }
        encoded_data = base64.b64encode(json.dumps(qr_payload).encode("utf-8")).decode("utf-8")
        qr_url = f"https://www.afip.gob.ar/fe/qr/?p={encoded_data}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=3,
            border=1,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, kind="PNG")
        buffer.seek(0)
        return buffer

    def _build_original_badge(self, usable_width: float) -> Table:
        """Construye el recuadro superior 'ORIGINAL'."""
        orig_table = Table(
            [[Paragraph("<b>ORIGINAL</b>", self.table_header)]],
            colWidths=[usable_width],
        )
        orig_table.setStyle(
            TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#18181b")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f4f4f5")),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ])
        )
        return orig_table

    def _build_header_box(
        self,
        usable_width: float,
        pto_vta_display: str,
        cmp_num_display: str,
        date_str: str,
    ) -> Table:
        """Construye el bloque de cabecera: Datos del Emisor | Letra C | Datos del Comprobante."""
        business_name = getattr(settings, "fiscal_business_name", "RODRIGUEZ MAURO GABRIEL")
        address = getattr(
            settings,
            "fiscal_commercial_address",
            "Cl Colectora Darsena Este 1365 - Villa Mercedes, San Luis",
        )
        vat_condition = getattr(settings, "fiscal_vat_condition", "Responsable Monotributo")
        cuit = getattr(settings, "fiscal_cuit", "20246728918")
        iibb = getattr(settings, "fiscal_iibb", "20246728918")
        start_date = getattr(settings, "fiscal_activity_start_date", "01/03/2017")

        left_header = [
            Paragraph(business_name, self.header_company),
            Spacer(1, 2 * mm),
            Paragraph(f"<b>Razón Social:</b> {business_name}", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph(f"<b>Domicilio Comercial:</b> {address}", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph(f"<b>Condición frente al IVA:</b> {vat_condition}", self.header_value),
        ]

        center_header = [
            Paragraph("<font size='22'><b>C</b></font>", ParagraphStyle("C", alignment=1, leading=22)),
            Paragraph("<b>COD. 011</b>", ParagraphStyle("Cod11", alignment=1, fontSize=7, leading=9)),
        ]

        right_header = [
            Paragraph("<b>FACTURA</b>", self.title_style),
            Spacer(1, 1.5 * mm),
            Paragraph(
                f"<b>Punto de Venta:</b> {pto_vta_display} &nbsp;&nbsp;&nbsp; <b>Comp. Nro:</b> {cmp_num_display}",
                self.header_label,
            ),
            Spacer(1, 1 * mm),
            Paragraph(f"<b>Fecha de Emisión:</b> {date_str}", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph(f"<b>CUIT:</b> {cuit}", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph(f"<b>Ingresos Brutos:</b> {iibb}", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph(f"<b>Fecha de Inicio de Actividades:</b> {start_date}", self.header_value),
        ]

        col_w_left = usable_width * 0.44
        col_w_mid = usable_width * 0.12
        col_w_right = usable_width * 0.44

        header_table = Table(
            [[left_header, center_header, right_header]],
            colWidths=[col_w_left, col_w_mid, col_w_right],
        )
        header_table.setStyle(
            TableStyle([
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#18181b")),
                ("LINEBEFORE", (1, 0), (1, -1), 0.75, colors.HexColor("#a1a1aa")),
                ("LINEAFTER", (1, 0), (1, -1), 0.75, colors.HexColor("#a1a1aa")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#fafafa")),
            ])
        )
        return header_table

    def _build_client_box(
        self,
        usable_width: float,
        order: dict[str, Any],
        raw_order_num: str,
        customer_dni: str,
    ) -> Table:
        """Construye el recuadro con los datos del cliente / consumidor final."""
        customer_name = str(order.get("customer_name") or "Consumidor Final")
        address = str(order.get("shipping_address") or "No especificado")
        city = str(order.get("shipping_city") or "")
        province = str(order.get("shipping_province") or "")
        cp = str(order.get("shipping_postal_code") or "")
        full_address = f"{address} - {city}, {province} (CP {cp})".strip(" - ,")

        client_data_left = [
            Paragraph(f"<b>DNI / CUIT:</b> {customer_dni or 'Consumidor Final'}", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph("<b>Condición frente al IVA:</b> Consumidor Final", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph("<b>Condición de venta:</b> Tarjeta / MercadoPago", self.header_value),
        ]

        client_data_right = [
            Paragraph(f"<b>Apellido y Nombre / Razón Social:</b> {customer_name}", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph(f"<b>Domicilio:</b> {full_address}", self.header_value),
            Spacer(1, 1 * mm),
            Paragraph(f"<b>Orden Referencia:</b> {raw_order_num}", self.header_value),
        ]

        client_table = Table(
            [[client_data_left, client_data_right]],
            colWidths=[usable_width * 0.45, usable_width * 0.55],
        )
        client_table.setStyle(
            TableStyle([
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#18181b")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
            ])
        )
        return client_table

    def _build_items_table(
        self,
        usable_width: float,
        order: dict[str, Any],
        shipping_cost: float,
        discount_amount: float,
    ) -> Table:
        """Construye la grilla reglamentaria de productos, envíos y descuentos."""
        item_headers = [
            Paragraph("<b>Código</b>", self.table_header),
            Paragraph("<b>Producto / Servicio</b>", self.table_header),
            Paragraph("<b>Cant.</b>", self.table_header),
            Paragraph("<b>U. Med.</b>", self.table_header),
            Paragraph("<b>Precio Unit.</b>", self.table_header),
            Paragraph("<b>% Bonif.</b>", self.table_header),
            Paragraph("<b>Imp. Bonif.</b>", self.table_header),
            Paragraph("<b>Subtotal</b>", self.table_header),
        ]

        table_rows = [item_headers]
        items = order.get("items") or []

        for idx, item in enumerate(items, 1):
            if isinstance(item, dict):
                p_name = item.get("product_name") or "Producto"
                v_name = item.get("variant_name") or ""
                sku = item.get("sku") or f"{idx:02d}"
                qty = item.get("quantity") or 1
                u_price = item.get("unit_price") or 0.0
                sub = item.get("subtotal") or (float(qty) * float(u_price))
            else:
                p_name = getattr(item, "product_name", "Producto")
                v_name = getattr(item, "variant_name", "")
                sku = getattr(item, "sku", f"{idx:02d}")
                qty = getattr(item, "quantity", 1)
                u_price = getattr(item, "unit_price", 0.0)
                sub = getattr(item, "subtotal", float(qty) * float(u_price))

            desc = f"{p_name}" + (f" ({v_name})" if v_name else "")

            table_rows.append([
                Paragraph(str(sku)[:15], self.cell_text),
                Paragraph(desc, self.cell_text_bold),
                Paragraph(f"{float(qty):.2f}", self.cell_text_right),
                Paragraph("unidades", self.cell_text),
                Paragraph(self._format_currency(u_price), self.cell_text_right),
                Paragraph("0,00", self.cell_text_right),
                Paragraph("0,00", self.cell_text_right),
                Paragraph(self._format_currency(sub), self.cell_text_right_bold),
            ])

        # Fila de Costo de Envío si aplica
        if shipping_cost > 0:
            table_rows.append([
                Paragraph("ENV-01", self.cell_text),
                Paragraph("Servicio de Envío a Domicilio (Andreani)", self.cell_text_bold),
                Paragraph("1.00", self.cell_text_right),
                Paragraph("unidades", self.cell_text),
                Paragraph(self._format_currency(shipping_cost), self.cell_text_right),
                Paragraph("0,00", self.cell_text_right),
                Paragraph("0,00", self.cell_text_right),
                Paragraph(self._format_currency(shipping_cost), self.cell_text_right_bold),
            ])

        # Fila de Descuento por Cupón si aplica
        coupon_code = order.get("coupon_code")
        if discount_amount > 0:
            table_rows.append([
                Paragraph("CUPON", self.cell_text),
                Paragraph(f"Descuento cupón promocional ({coupon_code or 'PROMO'})", self.cell_text_bold),
                Paragraph("1.00", self.cell_text_right),
                Paragraph("unidades", self.cell_text),
                Paragraph(f"-{self._format_currency(discount_amount)}", self.cell_text_right),
                Paragraph("0,00", self.cell_text_right),
                Paragraph("0,00", self.cell_text_right),
                Paragraph(f"-{self._format_currency(discount_amount)}", self.cell_text_right_bold),
            ])

        col_widths = [
            usable_width * 0.11,
            usable_width * 0.35,
            usable_width * 0.08,
            usable_width * 0.10,
            usable_width * 0.12,
            usable_width * 0.07,
            usable_width * 0.07,
            usable_width * 0.10,
        ]

        items_table = Table(table_rows, colWidths=col_widths, repeatRows=1)
        items_table.setStyle(
            TableStyle([
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#18181b")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d4d4d8")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e4e4e7")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 2.5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.5),
            ])
        )
        return items_table

    def _build_totals_table(
        self,
        usable_width: float,
        total_amount: float,
        subtotal_val: float,
        shipping_cost: float,
        discount_amount: float,
    ) -> Table:
        """Construye el desglose de totales de la factura."""
        totals_data = [
            [
                Paragraph("Subtotal:", self.cell_text_right),
                Paragraph(self._format_currency(subtotal_val), self.cell_text_right),
            ],
        ]
        if discount_amount > 0:
            totals_data.append([
                Paragraph("Descuento:", self.cell_text_right),
                Paragraph(f"-{self._format_currency(discount_amount)}", self.cell_text_right),
            ])
        if shipping_cost > 0:
            totals_data.append([
                Paragraph("Envío:", self.cell_text_right),
                Paragraph(self._format_currency(shipping_cost), self.cell_text_right),
            ])

        totals_data.append([
            Paragraph(
                "<b>Importe Total:</b>",
                ParagraphStyle("TotLabel", parent=self.title_style, fontSize=11, alignment=2),
            ),
            Paragraph(
                f"<b>{self._format_currency(total_amount)}</b>",
                ParagraphStyle(
                    "TotVal",
                    parent=self.title_style,
                    fontSize=12,
                    alignment=2,
                    textColor=colors.HexColor("#0f172a"),
                ),
            ),
        ])

        totals_table = Table(
            totals_data,
            colWidths=[usable_width * 0.80, usable_width * 0.20],
        )
        totals_table.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 1.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
            ])
        )
        return totals_table

    def _build_fiscal_footer(
        self,
        usable_width: float,
        pto_vta: int,
        cmp_num_int: int,
        total_amount: float,
        afip_date_str: str,
        active_cae: str,
        vto_cae: str,
        customer_dni: str,
    ) -> KeepTogether:
        """Construye el pie fiscal obligatorio con código QR de AFIP y datos CAE."""
        qr_buffer = self._generate_afip_qr(
            cuit=getattr(settings, "fiscal_cuit", "20246728918"),
            pto_vta=pto_vta,
            nro_cmp=cmp_num_int,
            total=total_amount,
            fecha=afip_date_str,
            cae=active_cae,
            doc_nro=customer_dni,
        )
        rl_qr_image = Image(qr_buffer, width=22 * mm, height=22 * mm)

        footer_left = [
            Table(
                [[
                    rl_qr_image,
                    [
                        Spacer(1, 2 * mm),
                        Paragraph("<b>ARCA / AFIP</b>", self.footer_bold),
                        Paragraph("Comprobante Autorizado", self.footer_bold),
                        Spacer(1, 1 * mm),
                        Paragraph(
                            "Esta administración federal garantiza la autenticidad del documento.",
                            self.footer_small,
                        ),
                    ],
                ]],
                colWidths=[25 * mm, (usable_width * 0.50) - (25 * mm)],
            )
        ]

        footer_right = [
            Spacer(1, 2 * mm),
            Paragraph(
                f"<b>CAE:</b> {active_cae}",
                ParagraphStyle("CAE", parent=self.header_company, fontSize=10, leading=13),
            ),
            Spacer(1, 1.5 * mm),
            Paragraph(
                f"<b>Fecha de Vto. de CAE:</b> {vto_cae}",
                ParagraphStyle("VTO", parent=self.header_company, fontSize=9, leading=12),
            ),
        ]

        footer_table = Table(
            [[footer_left, footer_right]],
            colWidths=[usable_width * 0.55, usable_width * 0.45],
        )
        footer_table.setStyle(
            TableStyle([
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#18181b")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fafafa")),
            ])
        )
        return KeepTogether(footer_table)

    def generate_invoice_pdf(
        self,
        order: dict[str, Any],
        cae: str | None = None,
        vto_cae: str | None = None,
        comp_number: str | None = None,
        emission_date: str | None = None,
    ) -> bytes:
        """
        Genera el archivo PDF binario de Factura C (Monotributo - Consumidor Final)
        replicando la estructura oficial de AFIP con métodos atómicos.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=10 * mm,
            rightMargin=10 * mm,
            topMargin=10 * mm,
            bottomMargin=10 * mm,
        )

        elements: list[Any] = []
        usable_width = 190 * mm  # A4 width (210mm) - 20mm margins

        # Fechas y números
        now = datetime.now()
        date_str = emission_date or now.strftime("%d/%m/%Y")
        afip_date_str = now.strftime("%Y-%m-%d")

        # Formateo del número de comprobante
        raw_order_num = str(order.get("order_number") or "ORD-2026-00001")
        if comp_number:
            cmp_num_int = int(comp_number) if str(comp_number).isdigit() else 1
            cmp_num_display = f"{cmp_num_int:08d}"
        else:
            digits = "".join(filter(str.isdigit, raw_order_num))
            cmp_num_int = int(digits[-5:]) if digits else 1
            cmp_num_display = f"{cmp_num_int:08d}"

        pto_vta = getattr(settings, "fiscal_point_of_sale", 3)
        pto_vta_display = f"{pto_vta:05d}"

        active_cae = str(cae or getattr(settings, "fiscal_cae_mock", "74389218392182"))
        if not vto_cae:
            vto_date = now + timedelta(days=10)
            vto_cae = vto_date.strftime("%d/%m/%Y")

        total_amount = float(order.get("total") or 0.0)
        shipping_cost = float(order.get("shipping_cost") or 0.0)
        discount_amount = float(order.get("discount_amount") or 0.0)
        subtotal_val = float(order.get("subtotal") or (total_amount - shipping_cost + discount_amount))
        customer_dni = str(order.get("customer_dni") or "").strip()

        # 1. ENCABEZADO "ORIGINAL"
        elements.append(self._build_original_badge(usable_width))

        # 2. CUADRO PRINCIPAL DE CABECERA (EMISOR | LETRA C | FACTURA)
        elements.append(self._build_header_box(usable_width, pto_vta_display, cmp_num_display, date_str))
        elements.append(Spacer(1, 2 * mm))

        # 3. DATOS DEL CLIENTE / RECEPTOR (CONSUMIDOR FINAL)
        elements.append(self._build_client_box(usable_width, order, raw_order_num, customer_dni))
        elements.append(Spacer(1, 2 * mm))

        # 4. TABLA DETALLADA DE PRODUCTOS Y SERVICIOS
        elements.append(self._build_items_table(usable_width, order, shipping_cost, discount_amount))
        elements.append(Spacer(1, 2 * mm))

        # 5. TOTALES DE LA FACTURA
        elements.append(
            self._build_totals_table(usable_width, total_amount, subtotal_val, shipping_cost, discount_amount)
        )
        elements.append(Spacer(1, 3 * mm))

        # 6. PIE FISCAL (QR OFICIAL AFIP + CAE + VTO)
        elements.append(
            self._build_fiscal_footer(
                usable_width=usable_width,
                pto_vta=pto_vta,
                cmp_num_int=cmp_num_int,
                total_amount=total_amount,
                afip_date_str=afip_date_str,
                active_cae=active_cae,
                vto_cae=vto_cae,
                customer_dni=customer_dni,
            )
        )

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()


_pdf_service_instance: PDFService | None = None


def get_pdf_service() -> PDFService:
    global _pdf_service_instance
    if _pdf_service_instance is None:
        _pdf_service_instance = PDFService()
    return _pdf_service_instance
