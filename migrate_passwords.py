from passlib.context import CryptContext

from app.database import SessionLocal
from app.models.user import User


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


db = SessionLocal()

try:
    users = db.query(User).all()

    for user in users:
        if user.password and not user.password.startswith("$2"):
            user.password = pwd_context.hash(user.password)

    db.commit()

    print(f"Successfully migrated {len(users)} user password(s).")

finally:
    db.close()