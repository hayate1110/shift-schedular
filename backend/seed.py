from sqlalchemy import select

from auth.security import hash_password
from database import SessionLocal
from models import User


def seed():
    db = SessionLocal()

    try:
        existing_user = db.scalar(
            select(User).where(User.username == "admin")
        )

        if existing_user:
            print("Admin user already exists.")
            return

        user = User(
            username="admin",
            password_hash=hash_password("admin123"),
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