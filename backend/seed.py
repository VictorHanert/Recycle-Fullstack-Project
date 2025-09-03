import random
from datetime import datetime, timedelta, timezone

from faker import Faker
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.mysql import engine, SessionLocal, Base, create_tables, drop_tables
from app.models import (
    User, Location, Category, Product, Color, Material, Tag,
    ProductImage, ProductPriceHistory, Favorite,
    Conversation, ConversationParticipant, Message,
    SoldItemArchive, ItemView,
)
from app.services.auth_service import AuthService

fake = Faker()

def reset_db():
    # Drop + create (only in dev!)
    drop_tables()
    create_tables()

def seed_locations(session: Session, n=10):
    locations = []
    for _ in range(n):
        loc = Location(
            city=fake.city(),
            postcode=fake.postcode()
        )
        session.add(loc)
        locations.append(loc)
    session.commit()
    return locations

def seed_users(session: Session, n=20, locations=None):
    users = []
    for _ in range(n):
        u = User(
            email=fake.unique.email(),
            hashed_password=AuthService.get_password_hash("password123"),
            username=fake.unique.user_name(),
            is_admin=random.choice([False, False, True]),
            is_active=True,
            location=random.choice(locations) if locations else None,
            full_name=fake.name(),
            phone=fake.phone_number()
        )
        session.add(u)
        users.append(u)
    session.commit()
    return users

def seed_categories(session: Session):
    root = Category(name="Furniture")
    chairs = Category(name="Chairs", parent=root)
    sofas = Category(name="Sofas", parent=root)
    table = Category(name="Tables", parent=root)
    session.add_all([root, chairs, sofas, table])
    session.commit()
    return [root, chairs, sofas, table]

def seed_details(session: Session):
    colors = [Color(name=c) for c in ["Red", "Blue", "Green", "Black", "White"]]
    materials = [Material(name=m) for m in ["Wood", "Metal", "Plastic", "Leather"]]
    tags = [Tag(name=t) for t in ["Vintage", "Modern", "Outdoor", "Office"]]
    session.add_all(colors + materials + tags)
    session.commit()
    return colors, materials, tags

def seed_products(session: Session, users, categories, locations, colors, materials, tags, n=50):
    products = []
    for _ in range(n):
        seller = random.choice(users)
        category = random.choice(categories)
        loc = random.choice(locations)
        prod = Product(
            seller=seller,
            title=fake.sentence(nb_words=4),
            description=fake.paragraph(nb_sentences=3),
            category=category,
            condition=random.choice(["new", "like_new", "good", "fair", "needs_repair"]),
            quantity=random.randint(1, 10),
            price_amount=round(random.uniform(10, 2000), 2),
            price_currency="USD",
            price_type=random.choice(["fixed", "negotiable", "auction"]),
            status=random.choice(["active", "sold", "paused", "draft"]),
            location=loc,
            created_at=fake.date_time_between(start_date="-2y", end_date="now", tzinfo=timezone.utc)
        )
        # add relations
        prod.colors = random.sample(colors, k=random.randint(0, 2))
        prod.materials = random.sample(materials, k=random.randint(0, 2))
        prod.tags = random.sample(tags, k=random.randint(0, 2))
        session.add(prod)
        products.append(prod)
    session.commit()

    # Add images & price history
    for p in products:
        for i in range(random.randint(1, 3)):
            img = ProductImage(
                product=p,
                url=fake.image_url(),
                alt_text=fake.word(),
                sort_order=i
            )
            session.add(img)
        for j in range(random.randint(1, 4)):
            hist = ProductPriceHistory(
                product=p,
                amount=round(random.uniform(5, 1500), 2),
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

    # build a set of unique pairs
    while len(pairs) < target:
        pairs.add((random.choice(user_ids), random.choice(product_ids)))

    # optional: skip pairs that might already exist in DB
    existing = set(
        session.execute(
            # lightweight fetch of existing pairs
            text("SELECT user_id, product_id FROM favorites")
        ).fetchall()
    )
    to_insert = [Favorite(user_id=u, product_id=p, created_at=fake.date_time_between(start_date="-1y", end_date="now", tzinfo=timezone.utc))
                 for (u, p) in pairs - existing]

    session.add_all(to_insert)
    session.commit()


def seed_conversations(session, users, products, n=20):
    for _ in range(n):
        prod = random.choice(products)

        # create conversation linked via FK
        conv = Conversation(product_id=prod.id)   # ← use product_id, not product
        session.add(conv)
        session.flush()  # get conv.id

        # ensure two distinct users
        buyer, seller = random.sample(users, 2)

        # participants (composite PK prevents duplicates)
        session.add_all([
            ConversationParticipant(conversation_id=conv.id, user_id=buyer.id),
            ConversationParticipant(conversation_id=conv.id, user_id=seller.id),
        ])

        # messages
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

def main():
    reset_db()
    db = SessionLocal()
    try:
        locations = seed_locations(db, 8)
        users = seed_users(db, 20, locations)
        
        # Create a specific admin user
        admin_user = User(
            email="admin@test.com",
            username="admin",
            full_name="Admin user",
            hashed_password=AuthService.get_password_hash("admin123"),
            is_admin=True,
            is_active=True,
            location=locations[0] if locations else None,
            phone=None
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
        print("✅ Database seeded with test data!")
        print("✅ Admin user created: admin@test.com / admin123")
    finally:
        db.close()

if __name__ == "__main__":
    main()
