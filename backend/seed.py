from sqlalchemy import select

from auth.security import hash_password
from database import SessionLocal, engine
from models import Base, User
from dotenv import load_dotenv
import os

load_dotenv()

SEED_ADMIN_USERNAME = os.environ["SEED_ADMIN_USERNAME"]
SEED_ADMIN_PASSWORD = os.environ["SEED_ADMIN_PASSWORD"]

def seed():
    # テーブルが存在しなければ作成
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        existing_user = db.scalar(
            select(User).where(User.username == "admin")
        )

        if existing_user:
            print("Admin user already exists.")
            return

        user = User(
            username=SEED_ADMIN_USERNAME,
            password_hash=hash_password(SEED_ADMIN_PASSWORD),
            name="管理者",
            employment_type="full_time",
            role="admin",
        )

        db.add(user)
        db.commit()

        print("Admin user created.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()