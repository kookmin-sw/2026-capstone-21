from __future__ import annotations
from typing import Optional, Union, List, Dict
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


# 사용자 테이블
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    user_name = Column(String(100), nullable=False)

    # user: 일반 사용자 / admin: 관리자
    role = Column(String(50), nullable=False, default="user")

    # active, inactive 등 계정 상태 관리
    status = Column(String(50), nullable=False, default="active")

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    mall_inputs = relationship("MallInput", back_populates="user", cascade="all, delete-orphan")
    recommendation_runs = relationship("RecommendationRun", back_populates="user", cascade="all, delete-orphan")
    action_logs = relationship("UserActionLog", back_populates="user", cascade="all, delete-orphan")
    favorite_influencers = relationship("FavoriteInfluencer", back_populates="user", cascade="all, delete-orphan")


# 카테고리 테이블
class Category(Base):
    __tablename__ = "category"

    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    influencer_categories = relationship(
        "InfluencerCategory",
        back_populates="category",
        cascade="all, delete-orphan",
    )


# 인플루언서 테이블
class Influencer(Base):
    __tablename__ = "influencer"

    influencer_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True)
    profile_url = Column(Text, nullable=True)
    full_name = Column(String(255), nullable=True)
    external_url = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    followers_count = Column(BigInteger, nullable=True)
    follows_count = Column(BigInteger, nullable=True)
    posts_count = Column(Integer, nullable=True)
    profile_pic_url = Column(Text, nullable=True)
    account_type = Column(String(50), nullable=True)

    # 인플루언서 등급/품질 점수
    grade_score = Column(Float, nullable=True)

    # 스타일 키워드 원본 JSON 및 검색/임베딩용 텍스트
    style_keywords_json = Column(JSON, nullable=True)
    style_keywords_text = Column(Text, nullable=True)

    # ✅ 수정: 사용자 화면/추천/통계 노출 여부
    # True  = 일반 사용자에게 노출
    # False = 제외 계정으로 보고 관리자에게만 노출
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    influencer_categories = relationship(
        "InfluencerCategory",
        back_populates="influencer",
        cascade="all, delete-orphan",
    )
    embedding = relationship(
        "InfluencerEmbedding",
        back_populates="influencer",
        uselist=False,
        cascade="all, delete-orphan",
    )
    recommendation_results = relationship(
        "RecommendationResult",
        back_populates="influencer",
        cascade="all, delete-orphan",
    )
    posts = relationship(
        "InfluencerPost",
        back_populates="influencer",
        cascade="all, delete-orphan",
    )
    source_relations = relationship(
        "InfluencerRelated",
        foreign_keys="InfluencerRelated.source_influencer_id",
        back_populates="source_influencer",
        cascade="all, delete-orphan",
    )
    target_relations = relationship(
        "InfluencerRelated",
        foreign_keys="InfluencerRelated.related_influencer_id",
        back_populates="related_influencer",
        cascade="all, delete-orphan",
    )
    action_logs = relationship(
        "UserActionLog",
        back_populates="influencer",
        cascade="all, delete-orphan",
    )
    favorite_users = relationship(
        "FavoriteInfluencer",
        back_populates="influencer",
        cascade="all, delete-orphan",
    )


# 인플루언서-카테고리 매핑 테이블
# 한 인플루언서가 여러 카테고리를 가질 수 있도록 M:N 구조 사용
class InfluencerCategory(Base):
    __tablename__ = "influencer_category"
    __table_args__ = (
        # 한 인플루언서 안에서 1순위, 2순위 카테고리가 중복되지 않게 함
        UniqueConstraint("influencer_id", "priority", name="uq_influencer_category_priority"),
    )

    influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        primary_key=True,
    )
    category_id = Column(
        Integer,
        ForeignKey("category.category_id", ondelete="CASCADE"),
        primary_key=True,
    )

    # 대표 카테고리 = 1, 보조 카테고리 = 2
    priority = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    influencer = relationship("Influencer", back_populates="influencer_categories")
    category = relationship("Category", back_populates="influencer_categories")


# 인플루언서 임베딩 테이블
class InfluencerEmbedding(Base):
    __tablename__ = "influencer_embedding"

    embedding_id = Column(Integer, primary_key=True, autoincrement=True)
    influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # 임베딩에 사용한 텍스트
    embedding_text = Column(Text, nullable=False)

    # 임베딩 벡터
    embedding_vector = Column(JSON, nullable=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    influencer = relationship("Influencer", back_populates="embedding")


# 쇼핑몰 입력 테이블
class MallInput(Base):
    __tablename__ = "mall_input"

    input_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    mall_name = Column(String(255), nullable=True)
    mall_url = Column(Text, nullable=True)

    # 쇼핑몰 설명/무드/키워드 입력 텍스트
    input_text = Column(Text, nullable=False)

    # 팔로워 필터 조건
    min_follower_count = Column(Integer, nullable=True)
    max_follower_count = Column(Integer, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="mall_inputs")
    embedding = relationship(
        "MallInputEmbedding",
        back_populates="mall_input",
        uselist=False,
        cascade="all, delete-orphan",
    )
    recommendation_runs = relationship(
        "RecommendationRun",
        back_populates="mall_input",
        cascade="all, delete-orphan",
    )


# 쇼핑몰 입력 임베딩 테이블
class MallInputEmbedding(Base):
    __tablename__ = "mall_input_embedding"

    input_embedding_id = Column(Integer, primary_key=True, autoincrement=True)
    input_id = Column(
        Integer,
        ForeignKey("mall_input.input_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    embedding_text = Column(Text, nullable=False)
    embedding_vector = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    mall_input = relationship("MallInput", back_populates="embedding")


# 추천 실행 기록 테이블
class RecommendationRun(Base):
    __tablename__ = "recommendation_run"

    run_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    input_id = Column(Integer, ForeignKey("mall_input.input_id", ondelete="CASCADE"), nullable=False)

    applied_action_idx = Column(Integer, nullable=True)

    status = Column(String(50), nullable=False, default="pending")

    requested_at = Column(DateTime, nullable=False, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    user = relationship("User", back_populates="recommendation_runs")
    mall_input = relationship("MallInput", back_populates="recommendation_runs")

    results = relationship(
        "RecommendationResult",
        back_populates="run",
        cascade="all, delete-orphan",
    )

    action_logs = relationship(
        "UserActionLog",
        back_populates="run",
    )


# 추천 결과 테이블
class RecommendationResult(Base):
    __tablename__ = "recommendation_result"
    __table_args__ = (
        UniqueConstraint("run_id", "influencer_id", name="uq_run_influencer"),
        UniqueConstraint("run_id", "rank_no", name="uq_run_rank"),
        Index("idx_recommendation_result_run_id", "run_id"),
        Index("idx_recommendation_result_influencer_id", "influencer_id"),
    )

    result_id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(
        Integer,
        ForeignKey("recommendation_run.run_id", ondelete="CASCADE"),
        nullable=False,
    )
    influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        nullable=False,
    )

    similarity_score = Column(Float, nullable=True)
    grade_score = Column(Float, nullable=True)
    personalization_score = Column(Float, nullable=True)

    # 최종 추천 점수
    final_score = Column(Float, nullable=False)

    # 추천 순위
    rank_no = Column(Integer, nullable=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    run = relationship("RecommendationRun", back_populates="results")
    influencer = relationship("Influencer", back_populates="recommendation_results")


# 인플루언서 게시글 테이블
class InfluencerPost(Base):
    __tablename__ = "influencer_post"
    __table_args__ = (
        Index("idx_influencer_post_influencer_id", "influencer_id"),
    )

    post_id = Column(String(50), primary_key=True)
    influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        nullable=False,
    )

    post_type = Column(String(50), nullable=True)
    caption = Column(Text, nullable=True)
    likes_count = Column(BigInteger, nullable=True)
    comments_count = Column(BigInteger, nullable=True)
    posted_at = Column(DateTime, nullable=True)
    post_url = Column(Text, nullable=True)
    display_url = Column(Text, nullable=True)
    hashtags_json = Column(JSON, nullable=True)
    mentions_json = Column(JSON, nullable=True)

    influencer = relationship("Influencer", back_populates="posts")


# 연관 인플루언서 테이블
class InfluencerRelated(Base):
    __tablename__ = "influencer_related"
    __table_args__ = (
        UniqueConstraint(
            "source_influencer_id",
            "related_influencer_id",
            name="uq_source_related_influencer",
        ),
        Index("idx_influencer_related_source_id", "source_influencer_id"),
        Index("idx_influencer_related_related_id", "related_influencer_id"),
    )

    relation_id = Column(Integer, primary_key=True, autoincrement=True)
    source_influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        nullable=False,
    )
    related_influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        nullable=False,
    )

    source_influencer = relationship(
        "Influencer",
        foreign_keys=[source_influencer_id],
        back_populates="source_relations",
    )
    related_influencer = relationship(
        "Influencer",
        foreign_keys=[related_influencer_id],
        back_populates="target_relations",
    )


# 사용자 행동 로그 테이블
# 추천 개인화 및 대시보드 통계에 활용
class UserActionLog(Base):
    __tablename__ = "user_action_log"
    __table_args__ = (
        Index("idx_user_action_log_user_id", "user_id"),
        Index("idx_user_action_log_influencer_id", "influencer_id"),
        Index("idx_user_action_log_run_id", "run_id"),
    )

    log_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        nullable=False,
    )

    # 추천 결과 기반 행동이면 run_id 저장
    # 일반 탐색 행동이면 NULL
    run_id = Column(
        Integer,
        ForeignKey("recommendation_run.run_id", ondelete="SET NULL"),
        nullable=True,
    )

    action_type = Column(String(50), nullable=False)

    reward = Column(Integer, nullable=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    user = relationship("User", back_populates="action_logs")
    influencer = relationship("Influencer", back_populates="action_logs")
    run = relationship("RecommendationRun", back_populates="action_logs")


# 관심 인플루언서 테이블
# My Picks 기능에서 사용
class FavoriteInfluencer(Base):
    __tablename__ = "favorite_influencer"
    __table_args__ = (
        # 한 사용자가 같은 인플루언서를 중복 관심 등록하지 못하도록 제한
        UniqueConstraint("user_id", "influencer_id", name="uq_user_influencer_favorite"),

        # 사용자별 관심 목록 조회 성능 개선
        Index("idx_favorite_influencer_user_id", "user_id"),

        # 인플루언서별 관심 여부 조회 성능 개선
        Index("idx_favorite_influencer_influencer_id", "influencer_id"),

        # 최신순 정렬 성능 개선
        Index("idx_favorite_created_at", "created_at"),
    )

    favorite_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        nullable=False,
    )

    # 관심 등록 이유
    # 기존 String(255)보다 Text가 길이 제한에 덜 민감함
    reason = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="favorite_influencers")
    influencer = relationship("Influencer", back_populates="favorite_users")

class ChatwootLog(Base):
    __tablename__ = "chatwoot_logs"

    # 1. 기본 키 및 식별자
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, nullable=False, index=True)
    
    # 2. 질문 및 답변 데이터
    question_content = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=True)
    answer_content = Column(Text, nullable=True)
    
    # 3. 시간 기록
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    answered_at = Column(DateTime(timezone=True), onupdate=func.now())