"""Seed the database with sample properties via direct SQLite access."""
import sqlite3
import uuid
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "proppilot.db")

PROPERTIES = [
    {
        "name": "Green Valley Villa",
        "location": "Hyderabad",
        "address": "Hitech City, Hyderabad",
        "price": 1,
        "bedrooms": 4,
        "bathrooms": 3,
        "area_sqft": 2400,
        "property_type": "villa",
        "description": "Premium 4 BHK villa in the heart of Hitech City with modern amenities and lush green surroundings.",
        "amenities": ["Swimming Pool", "Gym", "Parking", "24x7 Security", "Club House"],
        "builder_name": "Prestige Group",
        "is_active": True,
        "is_featured": True,
    },
    {
        "name": "Lakeview Apartment",
        "location": "Mumbai",
        "address": "Bandra West, Mumbai",
        "price": 7.5,
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1500,
        "property_type": "apartment",
        "description": "Spacious 3 BHK sea-facing apartment in Bandra with premium finishes.",
        "amenities": ["Sea View", "Gym", "Parking", "Power Backup", "Kids Play Area"],
        "builder_name": "Lodha Group",
        "is_active": True,
        "is_featured": True,
    },
    {
        "name": "Sunset Heights",
        "location": "Mumbai",
        "address": "Andheri East, Mumbai",
        "price": 5,
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1100,
        "property_type": "apartment",
        "description": "Affordable 2 BHK apartment near metro station with all modern conveniences.",
        "amenities": ["Parking", "Gym", "Garden", "Security"],
        "builder_name": "Runwal Group",
        "is_active": True,
        "is_featured": False,
    },
    {
        "name": "Royal Palm Bungalow",
        "location": "Hyderabad",
        "address": "Jubilee Hills, Hyderabad",
        "price": 2,
        "bedrooms": 5,
        "bathrooms": 4,
        "area_sqft": 4000,
        "property_type": "villa",
        "description": "Luxurious 5 BHK independent bungalow in prestigious Jubilee Hills.",
        "amenities": ["Swimming Pool", "Home Theater", "Garden", "Multiple Parking", "Staff Quarters"],
        "builder_name": "My Home Constructions",
        "is_active": True,
        "is_featured": True,
    },
    {
        "name": "Tech Park Studio",
        "location": "Bangalore",
        "address": "Whitefield, Bangalore",
        "price": 4,
        "bedrooms": 1,
        "bathrooms": 1,
        "area_sqft": 650,
        "property_type": "apartment",
        "description": "Compact 1 BHK studio near IT corridor, perfect for working professionals.",
        "amenities": ["Gym", "Pool", "Coworking Space", "Cafeteria"],
        "builder_name": "Brigade Group",
        "is_active": True,
        "is_featured": False,
    },
    {
        "name": "Emerald Meadows",
        "location": "Hyderabad",
        "address": "Gachibowli, Hyderabad",
        "price": 8,
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1800,
        "property_type": "apartment",
        "description": "Modern 3 BHK apartment in upcoming Gachibowli with lake view and premium amenities.",
        "amenities": ["Lake View", "Club House", "Swimming Pool", "Tennis Court", "Garden"],
        "builder_name": "Sobha Developers",
        "is_active": True,
        "is_featured": False,
    },
    {
        "name": "Shanti Niketan Plot",
        "location": "Hyderabad",
        "address": "Shamshabad, Hyderabad",
        "price": 3.5,
        "bedrooms": 0,
        "bathrooms": 0,
        "area_sqft": 1200,
        "property_type": "plot",
        "description": "Corner plot in well-developed layout with road access and all utilities connected.",
        "amenities": ["Road Access", "Electricity", "Water Connection", "Drainage"],
        "builder_name": "T S R Constructions",
        "is_active": True,
        "is_featured": False,
    },
    {
        "name": "Axis Commercial Tower",
        "location": "Mumbai",
        "address": "BKC, Mumbai",
        "price": 2.5,
        "bedrooms": 0,
        "bathrooms": 2,
        "area_sqft": 1200,
        "property_type": "commercial",
        "description": "Prime commercial office space in Bandra Kurla Complex with high footfall.",
        "amenities": ["24x7 Security", "Parking", "Cafeteria", "Conference Rooms"],
        "builder_name": "Hiranandani Group",
        "is_active": True,
        "is_featured": False,
    },
]


def seed():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    existing = cursor.execute("SELECT COUNT(*) as cnt FROM properties").fetchone()
    if existing["cnt"] > 0:
        print(f"Properties already seeded ({existing['cnt']} existing), skipping.")
        return

    for data in PROPERTIES:
        prop_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO properties (id, name, location, address, price,
                bedrooms, bathrooms, area_sqft, property_type, description,
                amenities, is_active, is_featured, builder_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """, (
            prop_id,
            data["name"],
            data["location"],
            data["address"],
            data["price"],
            data["bedrooms"],
            data["bathrooms"],
            data["area_sqft"],
            data["property_type"].upper(),
            data["description"],
            json.dumps(data["amenities"]),
            1 if data["is_active"] else 0,
            1 if data["is_featured"] else 0,
            data["builder_name"],
        ))

    conn.commit()
    conn.close()
    print(f"Seeded {len(PROPERTIES)} properties.")


if __name__ == "__main__":
    seed()
