from __future__ import annotations
from typing import Optional, Union, List, Dict
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.utils.setting_config import settings

engine = create_engine(
    settings.PICKPLE_DATABASE_URL,
    echo=True,
    future=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
