from app.db.database import SessionLocal
from app.db.models import Category

CATEGORY_NAMES = [
    "패션",
    "뷰티",
    "인테리어",
    "리빙",
    "푸드·맛집",
    "여행",
    "헬스·웰니스",
    "육아·가족",
    "반려동물",
    "라이프스타일",
    "기타"
]


def seed_categories():
    db = SessionLocal()
    try:
        for name in CATEGORY_NAMES:
            exists = db.query(Category).filter(Category.category_name == name).first()
            if not exists:
                db.add(Category(category_name=name))

        db.commit()
        print("카테고리 초기 데이터 저장 완료")
    except Exception as e:
        db.rollback()
        print("에러 발생:", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()
