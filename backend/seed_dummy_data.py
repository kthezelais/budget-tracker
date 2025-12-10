import random
import string
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import (
    Base,
    Transaction,
    MonthlyBudget,
    Setting,
    Device,
    DATABASE_URL
)

# --------------------------------------------------------------------
# CONFIG
# --------------------------------------------------------------------
NUM_TRANSACTIONS = 150
NUM_MONTHLY_BUDGETS = 12
DEVICE_USERNAME = "dev_user"

# --------------------------------------------------------------------
# DB SETUP
# --------------------------------------------------------------------
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------
#       DATA GENERATION
# ---------------------------

def random_date(start, end):
    """Return a random datetime between start and end"""
    delta = end - start
    seconds = delta.total_seconds()
    return start + timedelta(seconds=random.randint(0, int(seconds)))


def generate_dummy_data(session):
    print("\n--- Populating database with dummy data ---\n")

    # ----- Settings
    existing_settings = session.query(Setting).count()
    if existing_settings == 0:
        print("→ Inserting settings (table was empty).")
        settings_data = [
            ("default_budget_amount", "1000"),
            ("api_key", "my-api-key"),
        ]
        for k, v in settings_data:
            session.add(Setting(
                key=k,
                value=v,
                updated_at=datetime.now()
            ))
    else:
        print("→ Settings table already filled, leaving it as-is.")

    # ----- Device
    print("→ Adding devices...")
    devices = []
    for i in range(2):
        dev = Device(
            device_id=f"dev-{i+1:04d}",
            username=f"user{i+1}",
            device_name=random.choice(["Pixel 7", "Galaxy S22", "OnePlus 11"]),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        session.add(dev)
        devices.append(dev)

    session.flush()  # ensures devices get IDs

    # ----- Monthly Budgets
    print("→ Adding monthly budgets (12 months)...")
    base = datetime.now().replace(day=1)
    budgets = []
    for i in range(12):
        month = base - timedelta(days=30*i)
        obj = MonthlyBudget(
            month_year=month.strftime("%Y-%m"),
            budget_amount=random.choice([2000, 2500, 3000, 1500, 1800]),
            rollover_enabled=random.choice([True, False]),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        session.add(obj)
        budgets.append(obj)

    # ----- Transactions
    print("→ Adding transactions (random edge cases)...")

    transaction_names = [
        "Groceries", "Rent", "Casino winnings", "Refund - Shoes",
        "Restaurant 🍕", "Salary", "Bonus", "Coffee ☕", "Subscription - Netflix",
        "Laptop Repair", "Gift 🎁", "Car Insurance", "Fuel ⛽",
        "",                       # empty name edge case
        "A" * 80,                 # long name edge case
    ]

    now = datetime.now()
    last_year = now - timedelta(days=365)

    for _ in range(NUM_TRANSACTIONS):
        name = random.choice(transaction_names)

        # always positive amount
        amount = round(random.uniform(1, 2000), 2)

        # deposit or withdraw
        ttype = random.choice(["deposit", "withdraw"])

        ts = random_date(last_year, now)

        session.add(Transaction(
            device_id=random.choice(devices).device_id,
            name=name,
            amount=amount,
            type=ttype,
            timestamp=ts,
            created_at=ts,
            updated_at=ts
        ))

    print("\n→ Dummy data inserted!\n")


# ---------------------------
#       MAIN EXECUTION
# ---------------------------

def main():
    print("=== Budget Tracker Seed Script ===")

    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    # Create tables if missing
    Base.metadata.create_all(engine)

    # Detect existing data
    tables = {
        "transactions": session.query(Transaction).count(),
        "monthly_budgets": session.query(MonthlyBudget).count(),
        "devices": session.query(Device).count(),
    }

    needs_confirmation = any(count > 0 for count in tables.values())

    if needs_confirmation:
        print("\n⚠️ Existing data detected:")
        for name, count in tables.items():
            print(f" - {name}: {count} rows")

        resp = input("\nDo you want to overwrite these tables? (y/N): ").strip().lower()
        if resp != "y":
            print("Aborted.")
            return

        # Clear tables except settings
        print("\n→ Clearing existing data (except settings)...")
        session.query(Transaction).delete()
        session.query(MonthlyBudget).delete()
        session.query(Device).delete()

    generate_dummy_data(session)

    session.commit()
    print("🎉 Database seeding complete!\n")


if __name__ == "__main__":
    main()
