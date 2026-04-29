from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import joinedload

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Influencer, InfluencerEmbedding, InfluencerCategory
from app.utils.setting_config import settings


# 임베딩 텍스트
def make_embedding_text(influencer):
    # 1. 카테고리
    primary_category = "카테고리 없음"

    for ic in influencer.influencer_categories:
        if ic.priority == 1 and ic.category:
            primary_category = ic.category.category_name
            break

    if primary_category == "카테고리 없음" and influencer.influencer_categories:
        first = influencer.influencer_categories[0].category
        if first:
            primary_category = first.category_name

    # 2. 키워드
    keywords_text = "스타일 정보 없음"

    if influencer.style_keywords_text:
        keywords_text = influencer.style_keywords_text.strip()
    elif influencer.style_keywords_json:
        keywords_text = ", ".join(influencer.style_keywords_json)

    # 3. account_type
    account_type = influencer.account_type or "인플루언서"

    return f"{primary_category} 카테고리, {keywords_text} 특징의 {account_type}"


def build_embeddings(db: Session):

    try:
        print("인플루언서 조회 중...")

        influencers = (
            db.query(Influencer)
            .options(
                joinedload(Influencer.influencer_categories).joinedload(
                    InfluencerCategory.category
                ),
                joinedload(Influencer.embedding),
            )
            .all()
        )

        print(f"총 {len(influencers)}명")

        texts = [make_embedding_text(inf) for inf in influencers]

        print("모델 로드 중...")
        model = SentenceTransformer(settings.EMBEDDING_MODEL)

        print("임베딩 생성 중...")
        vectors = model.encode(
            texts,
            batch_size=32,
            show_progress_bar=True,
            normalize_embeddings=True,
        )

        print("DB 저장 중...")

        for inf, text, vec in zip(influencers, texts, vectors):
            vec_list = vec.tolist()

            if inf.embedding:
                inf.embedding.embedding_text = text
                inf.embedding.embedding_vector = vec_list
            else:
                new_emb = InfluencerEmbedding(
                    influencer_id=inf.influencer_id,
                    embedding_text=text,
                    embedding_vector=vec_list,
                )
                db.add(new_emb)

        db.commit()
        print("✅ 임베딩 저장 완료!")

    except Exception as e:
        db.rollback()
        print("❌ 에러:", e)

    finally:
        db.close()


if __name__ == "__main__":
    build_embeddings()