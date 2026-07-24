"""
Create (or promote) an admin user for the AUR platform.

Usage:
    python create_admin.py                      # uses defaults below
    python create_admin.py <email> <password> [first] [last]

If a user with the given email already exists, this promotes them to admin
and (optionally) resets their password. Otherwise a new admin is created.
"""

import asyncio
import sys

import bcrypt
from sqlalchemy import select

from database.connections import AsyncSessionLocal, init_db
from database.models import User

DEFAULT_EMAIL = "admin@aur.edu"
DEFAULT_PASSWORD = "admin1234"
DEFAULT_FIRST = "AUR"
DEFAULT_LAST = "Admin"


async def create_admin(email: str, password: str, first: str, last: str) -> None:
    await init_db()

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            user.role = "admin"
            user.password_hash = password_hash
            action = "promoted to admin (password reset)"
        else:
            user = User(
                first_name=first,
                last_name=last,
                email=email,
                password_hash=password_hash,
                role="admin",
            )
            db.add(user)
            action = "created"

        await db.commit()
        await db.refresh(user)

    print(f"[OK] Admin {action}:")
    print(f"   email:    {email}")
    print(f"   password: {password}")
    print(f"   id:       {user.id}")


if __name__ == "__main__":
    args = sys.argv[1:]
    email = args[0] if len(args) > 0 else DEFAULT_EMAIL
    password = args[1] if len(args) > 1 else DEFAULT_PASSWORD
    first = args[2] if len(args) > 2 else DEFAULT_FIRST
    last = args[3] if len(args) > 3 else DEFAULT_LAST

    asyncio.run(create_admin(email, password, first, last))
