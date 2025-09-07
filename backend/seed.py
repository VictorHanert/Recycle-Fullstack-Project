import random
from datetime import datetime, timedelta, timezone

from faker import Faker
import requests
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.mysql import SessionLocal, create_tables, drop_tables
from app.models import (
    User, Location, Category, Product, Color, Material, Tag,
    ProductImage, ProductPriceHistory, Favorite,
    Conversation, ConversationParticipant, Message,
    SoldItemArchive, ItemView,
)
from app.services.auth_service import AuthService

fake = Faker()

# -----------------
# DB Reset
# -----------------
def reset_db():
    drop_tables()
    create_tables()

# -----------------
# Seeders
# -----------------
def seed_locations(session: Session):
    dk_cities = [
        ("Copenhagen", "1000"),
        ("Aarhus", "8000"),
        ("Odense", "5000"),
        ("Aalborg", "9000"),
        ("Esbjerg", "6700"),
        ("Randers", "8900"),
        ("Kolding", "6000"),
        ("Horsens", "8700"),
        ("Vejle", "7100"),
        ("Roskilde", "4000"),
    ]
    locations = []
    for city, postcode in dk_cities:
        loc = Location(city=city, postcode=postcode)
        session.add(loc)
        locations.append(loc)
    session.commit()
    return locations


def seed_users(session: Session, n=20, locations=None):
    users = []
    for _ in range(n):
        first = fake.first_name()
        last = fake.last_name()
        full_name = f"{first} {last}"

        # email & username loosely aligned
        base = f"{first.lower()}.{last.lower()}"
        email = f"{base}@example.com"
        username = random.choice([
            base,
            first.lower() + str(random.randint(1, 99)),
            last.lower() + str(random.randint(1, 99)),
            base.replace(".", "_")
        ])

        u = User(
            email=email,
            hashed_password=AuthService.get_password_hash("password123"),
            username=username,
            is_admin=False,
            is_active=True,
            location=random.choice(locations) if locations else None,
            full_name=full_name,
            phone="".join([str(random.randint(0, 9)) for _ in range(8)]),
        )
        session.add(u)
        users.append(u)
    session.commit()
    return users


def seed_categories(session: Session):
    root = Category(name="Bicycles")
    categories = [
        Category(name="Road Bikes", parent=root),
        Category(name="Mountain Bikes", parent=root),
        Category(name="Hybrid Bikes", parent=root),
        Category(name="BMX", parent=root),
        Category(name="Electric Bikes", parent=root),
        Category(name="Folding Bikes", parent=root),
        Category(name="Kids Bikes", parent=root),
    ]
    session.add(root)
    session.add_all(categories)
    session.commit()
    return [root] + categories


def seed_details(session: Session):
    colors = [Color(name=c) for c in ["Red", "Blue", "Green", "Black", "White", "Silver", "Yellow"]]
    materials = [Material(name=m) for m in ["Aluminum", "Carbon Fiber", "Steel", "Titanium"]]
    tags = [Tag(name=t) for t in [
        "Vintage", "Lightweight", "Racing", "Commuter", "Off-road", "Foldable", "E-bike"
    ]]
    session.add_all(colors + materials + tags)
    session.commit()
    return colors, materials, tags


def seed_products(session: Session, users, categories, locations, colors, materials, tags, n=80):
    brands = [
        "Trek", "Giant", "Specialized", "Cannondale", "Scott",
        "Canyon", "Bianchi", "Santa Cruz", "Merida", "Cube"
    ]
    conditions = ["new", "like_new", "good", "fair", "needs_repair"]

    products = []
    for _ in range(n):
        seller = random.choice(users)
        category = random.choice(categories[1:])  # skip root "Bicycles"
        loc = random.choice(locations)

        brand = random.choice(brands)
        bike_type = category.name
        title = f"{brand} {bike_type}"

        prod = Product(
            seller=seller,
            title=title,
            description=f"A {bike_type.lower()} from {brand}. {fake.paragraph(nb_sentences=2)}",
            category=category,
            condition=random.choice(conditions),
            quantity=1,
            price_amount=random.randint(250, 25000),
            price_currency="DKK",
            price_type=random.choice(["fixed", "negotiable"]),
            status=random.choice(["active", "sold", "paused"]),
            location=loc,
            created_at=fake.date_time_between(start_date="-2y", end_date="now", tzinfo=timezone.utc)
        )

        prod.colors = random.sample(colors, k=random.randint(1, 2))
        prod.materials = random.sample(materials, k=1)
        prod.tags = random.sample(tags, k=random.randint(0, 2))
        session.add(prod)
        products.append(prod)
    session.commit()


    # fetch Unsplash image
    def fetch_unsplash_bike_image(query="used_bicycle"):
        access_key = "ghdemshFN49d3S0RbExlmtShkG5MK0e9-o6fzqk1-ns"
        url = f"https://api.unsplash.com/search/photos?query={query}&per_page=30&client_id={access_key}"
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data["results"]:
                    return random.choice(data["results"])['urls']['regular']
        except Exception as e:
            print(f"Unsplash API error: {e}")
        # fallback to Unsplash source if API fails
        return f"https://source.unsplash.com/640x480/?bicycle"

    # images & price history
    for p in products:
        for i in range(random.randint(1, 3)):
            # Use category and brand for more relevant images
            keywords = f"bicycle,{p.category.name},{p.title.split()[0]}"
            image_url = fetch_unsplash_bike_image(keywords)
            img = ProductImage(
                product=p,
                url=image_url,
                alt_text=f"{p.title} photo",
                sort_order=i
            )
            session.add(img)
        for j in range(random.randint(1, 4)):
            hist = ProductPriceHistory(
                product=p,
                amount=round(random.uniform(50, float(p.price_amount)), 2),  # cast to float
                currency="USD",
                changed_at=fake.date_time_between(start_date="-2y", end_date="now", tzinfo=timezone.utc)
            )
            session.add(hist)
    session.commit()
    return products


def seed_favorites(session, users, products, n=50):
    user_ids = [u.id for u in users]
    product_ids = [p.id for p in products]
    max_possible = len(user_ids) * len(product_ids)

    target = min(n, max_possible)
    pairs = set()

    while len(pairs) < target:
        pairs.add((random.choice(user_ids), random.choice(product_ids)))

    existing = set(
        session.execute(
            text("SELECT user_id, product_id FROM favorites")
        ).fetchall()
    )
    to_insert = [Favorite(user_id=u, product_id=p,
                          created_at=fake.date_time_between(start_date="-1y", end_date="now", tzinfo=timezone.utc))
                 for (u, p) in pairs - existing]

    session.add_all(to_insert)
    session.commit()


def seed_conversations(session, users, products, n=20):
    for _ in range(n):
        prod = random.choice(products)
        conv = Conversation(product_id=prod.id)
        session.add(conv)
        session.flush()

        buyer, seller = random.sample(users, 2)
        session.add_all([
            ConversationParticipant(conversation_id=conv.id, user_id=buyer.id),
            ConversationParticipant(conversation_id=conv.id, user_id=seller.id),
        ])

        for _ in range(random.randint(2, 6)):
            session.add(
                Message(
                    conversation_id=conv.id,
                    sender_id=random.choice([buyer.id, seller.id]),
                    body=fake.sentence(),
                    created_at=fake.date_time_between(start_date="-6mo", end_date="now", tzinfo=timezone.utc),
                )
            )
    session.commit()


def seed_sold_archive(session: Session, products):
    for p in random.sample(products, k=len(products)//5):
        archive = SoldItemArchive(
            product_id=p.id,
            title=p.title,
            category_id=p.category_id,
            location_id=p.location_id,
            price_amount=p.price_amount,
            price_currency=p.price_currency,
            sold_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 365))
        )
        session.add(archive)
    session.commit()


def seed_views(session: Session, users, products, n=200):
    for _ in range(n):
        view = ItemView(
            product=random.choice(products),
            viewer=random.choice(users) if random.random() < 0.7 else None,
            session_id=fake.uuid4(),
            user_agent=fake.user_agent(),
            referer=fake.url(),
            viewed_at=fake.date_time_between(start_date="-1y", end_date="now", tzinfo=timezone.utc)
        )
        session.add(view)
    session.commit()

# -----------------
# MAIN
# -----------------
def main():
    reset_db()
    db = SessionLocal()
    try:
        locations = seed_locations(db)
        users = seed_users(db, 20, locations)

        # fixed admin
        admin_user = User(
            email="admin@test.com",
            username="admin",
            full_name="Admin User",
            hashed_password=AuthService.get_password_hash("admin123"),
            is_admin=True,
            is_active=True,
            location=locations[0] if locations else None,
            phone="12345678"
        )
        db.add(admin_user)
        db.commit()
        users.append(admin_user)

        categories = seed_categories(db)
        colors, materials, tags = seed_details(db)
        products = seed_products(db, users, categories, locations, colors, materials, tags, 50)
        seed_favorites(db, users, products, 80)
        seed_conversations(db, users, products, 15)
        seed_sold_archive(db, products)
        seed_views(db, users, products, 300)

        print("✅ Database seeded with Danish bicycle marketplace data!")
        print("✅ Admin user: admin@test.com / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
