from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, field_validator

StatusType = Literal["todo", "in_progress", "done"]


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: StatusType = "todo"
    due_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title은 빈 문자열일 수 없습니다")
        return v.strip()


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StatusType] = None
    due_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("title은 빈 문자열일 수 없습니다")
        return v.strip() if v else v


class TaskSummary(BaseModel):
    """목록 응답 — description 제외"""
    id: int
    title: str
    status: str
    due_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskResponse(TaskSummary):
    """단건 응답 — description 포함"""
    description: Optional[str]
