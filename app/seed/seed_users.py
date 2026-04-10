from app.db.database import SessionLocal
from app.db.models import User


def seed_users():
    db = SessionLocal()
    try:
        users = [
            {
                "email": "test1@example.com",
                "password_hash": "test_hash_1",
                "user_name": "test_user_1",
                "role": "user",
                "status": "active",
            },
            {
                "email": "test2@example.com",
                "password_hash": "test_hash_2",
                "user_name": "test_user_2",
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