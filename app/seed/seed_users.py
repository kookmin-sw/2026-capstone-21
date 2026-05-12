from __future__ import annotations
from typing import Optional, Union, List, Dict
from app.db.database import SessionLocal
from app.db.models import User
from app.utils.auth import hash_password


def seed_users():
    db = SessionLocal()
    try:
        users = [
            {
                "email": "test1@example.com",
                "password_hash": hash_password("test_password_1"),
                "user_name": "test_admin",
                "role": "admin",
                "status": "active",
            },
            {
                "email": "test2@example.com",
                "password_hash": hash_password("test_password_2"),
                "user_name": "test_user",
                "role": "user",
                "status": "active",
            },
            {
                "email": "pre_test1@example.com",
                "password_hash": hash_password("test_password_1"),
                "user_name": "test_user_2",
                "role": "user",
                "status": "active",
            },
            {
                "email": "pre_test2@example.com",
                "password_hash": hash_password("test_password_2"),
                "user_name": "test_user_2",
                "role": "user",
                "status": "active",
            },
            {
                "email": "pre_test3@example.com",
                "password_hash": hash_password("test_password_3"),
                "user_name": "test_user_3",
                "role": "user",
                "status": "active",
            },
                        {
                "email": "pre_test4@example.com",
                "password_hash": hash_password("test_password_4"),
                "user_name": "test_user_4",
                "role": "user",
                "status": "active",
            },
            {
                "email": "pre_test5@example.com",
                "password_hash": hash_password("test_password_5"),
                "user_name": "test_user_5",
                "role": "user",
                "status": "active",
            },
        ]

        for item in users:
            exists = db.query(User).filter(User.email == item["email"]).first()
            if not exists:
                db.add(User(**item))

        db.commit()
        print("유저 초기 데이터 저장 완료")
    except Exception as e:
        db.rollback()
        print("에러 발생:", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()