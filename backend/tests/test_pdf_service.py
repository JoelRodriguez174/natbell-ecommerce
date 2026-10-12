
from app.services.pdf_service import PDFService, get_pdf_service


def test_get_pdf_service_singleton():
    s1 = get_pdf_service()
    s2 = get_pdf_service()
    assert isinstance(s1, PDFService)
    assert s1 is s2


def test_generate_invoice_pdf_basic():
    service = PDFService()
    sample_order = {
        "order_number": "ORD-2026-00136",
        "customer_name": "DADONE JUAN JOSE",
        "customer_dni": "20431581931",
        "shipping_address": "Los Andes 543",
        "shipping_city": "Justo Daract",
        "shipping_province": "San Luis",
        "shipping_postal_code": "5738",
        "shipping_cost": 2500.0,
        "discount_amount": 1000.0,
        "coupon_code": "BIENVENIDA10",
        "subtotal": 45000.0,
        "total": 46500.0,
        "items": [
            {
                "product_name": "Shampoo Matizador Blue",
                "variant_name": "Envase 500ml",
                "sku": "NOV-SH-BLU-500",
                "quantity": 2,
                "unit_price": 22500.0,
                "subtotal": 45000.0,
            }
        ],
    }

    pdf_bytes = service.generate_invoice_pdf(sample_order)

    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 5000  # A valid Factura C PDF is at least ~9-11 KB


def test_generate_invoice_pdf_minimal_no_dni():
    service = PDFService()
    sample_order = {
        "order_number": "ORD-2026-00001",
        "customer_name": "Consumidor Final",
        "customer_dni": None,
        "shipping_address": "Av. Mitre 1200",
        "total": 12000.0,
        "items": [
            {
                "product_name": "Máscara Capilar Keratina",
                "quantity": 1,
                "unit_price": 12000.0,
                "subtotal": 12000.0,
            }
        ],
    }

    pdf_bytes = service.generate_invoice_pdf(
        order=sample_order,
        cae="12345678901234",
        vto_cae="25/12/2026",
        comp_number="00000001",
    )

    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 5000


def test_afip_qr_code_generation():
    service = PDFService()
    qr_buffer = service._generate_afip_qr(
        cuit="20246728918",
        pto_vta=3,
        nro_cmp=136,
        total=450000.0,
        fecha="2026-09-11",
        cae="74389218392182",
        doc_nro="20431581931",
    )
    qr_bytes = qr_buffer.getvalue()
    # PNG starts with \x89PNG\r\n\x1a\n
    assert qr_bytes.startswith(b"\x89PNG")
    assert len(qr_bytes) > 200
