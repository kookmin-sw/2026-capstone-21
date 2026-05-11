# download_model.py
from sentence_transformers import SentenceTransformer
import os

# 사용할 모델명 (settings와 동일하게 설정)
MODEL_NAME = "BAAI/bge-m3"

def download():
    print(f"--- Downloading model: {MODEL_NAME} ---")
    # 모델을 현재 디렉토리의 'model_cache' 폴더에 다운로드합니다.
    model = SentenceTransformer(MODEL_NAME)
    model.save('./model_cache')
    print("--- Download Complete ---")

if __name__ == "__main__":
    download()