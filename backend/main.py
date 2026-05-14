import os
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import tasks

# 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaskFlow Pro API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경 — 프로덕션에서 도메인 제한 필요
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # 명세 준수: Pydantic 검증 오류를 422 대신 400으로 반환
    return JSONResponse(status_code=400, content={"detail": jsonable_encoder(exc.errors())})


app.include_router(tasks.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# 프론트엔드 정적 파일 서빙 — /api 라우터 등록 후 마지막에 마운트
frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
if os.path.isdir(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
