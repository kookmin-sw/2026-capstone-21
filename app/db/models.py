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


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    user_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="user")
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
    result_selections = relationship(
        "RecommendationResultSelection",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    action_logs = relationship(
        "UserActionLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )


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
    grade_score = Column(Float, nullable=True)
    style_keywords_json = Column(JSON, nullable=True)
    style_keywords_text = Column(Text, nullable=True)
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


class InfluencerCategory(Base):
    __tablename__ = "influencer_category"

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
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    influencer = relationship("Influencer", back_populates="influencer_categories")
    category = relationship("Category", back_populates="influencer_categories")


class InfluencerEmbedding(Base):
    __tablename__ = "influencer_embedding"

    embedding_id = Column(Integer, primary_key=True, autoincrement=True)
    influencer_id = Column(
        Integer,
        ForeignKey("influencer.influencer_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    embedding_text = Column(Text, nullable=False)
    embedding_vector = Column(JSON, nullable=False)
    embedding_model = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    influencer = relationship("Influencer", back_populates="embedding")


class MallInput(Base):
    __tablename__ = "mall_input"

    input_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    mall_name = Column(String(255), nullable=False)
    mall_url = Column(Text, nullable=True)
    input_text = Column(Text, nullable=False)
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
    embedding_model = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    mall_input = relationship("MallInput", back_populates="embedding")


class RecommendationRun(Base):
    __tablename__ = "recommendation_run"

    run_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    input_id = Column(Integer, ForeignKey("mall_input.input_id", ondelete="CASCADE"), nullable=False)
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
    final_score = Column(Float, nullable=False)
    rank_no = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    run = relationship("RecommendationRun", back_populates="results")
    influencer = relationship("Influencer", back_populates="recommendation_results")
    selections = relationship(
        "RecommendationResultSelection",
        back_populates="result",
        cascade="all, delete-orphan",
    )


class RecommendationResultSelection(Base):
    __tablename__ = "recommendation_result_selection"
    __table_args__ = (
        UniqueConstraint("user_id", "result_id", name="uq_user_result"),
    )

    selection_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    result_id = Column(
        Integer,
        ForeignKey("recommendation_result.result_id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    user = relationship("User", back_populates="result_selections")
    result = relationship("RecommendationResult", back_populates="selections")


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


class UserActionLog(Base):
    __tablename__ = "user_action_log"
    __table_args__ = (
        Index("idx_user_action_log_user_id", "user_id"),
        Index("idx_user_action_log_influencer_id", "influencer_id"),
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

    action_type = Column(String(50), nullable=False)
    reward = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    user = relationship("User", back_populates="action_logs")
    influencer = relationship("Influencer", back_populates="action_logs")