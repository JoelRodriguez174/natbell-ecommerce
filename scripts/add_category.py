import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("backend/.env")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def add_category():
    data, count = supabase.table("categories").upsert({
        "name": "Polvos Decolorantes",
        "slug": "polvos-decolorantes",
        "description": "Polvos decolorantes para trabajos de decoloración y balayage",
        "display_order": 12
    }).execute()
    print("Categoría añadida con éxito:", data)

if __name__ == "__main__":
    add_category()
