import os
import boto3
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Influencer
from app.utils.setting_config import settings

# AWS 설정 (환경변수나 ~/.aws/credentials에 설정되어 있어야 함)
AWS_ACCESS_KEY = '당신의_액세스_키'
AWS_SECRET_KEY = '당신의_시크릿_키'
BUCKET_NAME = 'your-bucket-name' # S3 버킷 이름
REGION_NAME = 'ap-northeast-2' # 서울 리전

def seed_images_to_s3(local_folder):
    db: Session = SessionLocal()
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY,
        aws_secret_access_key=settings.AWS_SECRET_KEY,
        region_name=settings.REGION_NAME
    )
    
    local_folder = "app/data/profile_pic_HD" # 로컬 이미지 경로
    bucket_name = settings.BUCKET_NAME

    files = [f for f in os.listdir(local_folder) if f.endswith(('.jpg', '.jpeg', '.png'))]
    print(f"🚀 총 {len(files)}개의 이미지를 S3로 업로드를 시작합니다.")

    # 폴더 내 모든 파일 탐색
    for filename in files:
        username, _ = os.path.splitext(filename)

        local_path = os.path.join(local_folder, filename)
        s3_key = f"profile_pics/{filename}"

        try:
            with open(local_path, "rb") as data:
                s3.upload_file(
                    data, 
                    BUCKET_NAME, 
                    s3_key,
                    ExtraArgs={'ACL': 'public-read', 'ContentType': 'image/jpeg'}
                )
            
            # 업로드된 URL 생성
            s3_url = f"https://{BUCKET_NAME}.s3.{REGION_NAME}.amazonaws.com/{s3_path}"
            
            influencer = db.query(Influencer).filter(Influencer.username == username).first()
            if influencer:
                influencer.profile_pic_url = s3_url
                print(f"✅ 성공: {username} -> {s3_url}")
            else:
                print(f"⚠️ 경고: DB에 {username}이 없습니다. (S3에만 업로드됨)")
            
        except FileNotFoundError:
            print(f"❌ 파일을 찾을 수 없음: {local_path}")
        except NoCredentialsError:
            print("❌ AWS 자격 증명이 없습니다.")
            return None

    db.commit()
    db.close()

    return uploaded_urls

if __name__ == "__main__":
    LOCAL_IMG_DIR = "app/data/profile_pic_HD"
    result_urls = upload_images_to_s3(LOCAL_IMG_DIR)
    
    print(f"\n총 {len(result_urls)}개의 이미지가 업로드되었습니다.")