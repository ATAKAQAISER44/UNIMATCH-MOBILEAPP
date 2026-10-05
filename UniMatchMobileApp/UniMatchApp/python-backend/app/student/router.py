from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.student.plan_service import build_student_plan

router = APIRouter(prefix="/student", tags=["Student"])


class StudentPlanRequest(BaseModel):
    universities: list[dict] = Field(default_factory=list)  # [{name, country}]
    profile: dict = Field(default_factory=dict)  # same shape as the smart-match profile


@router.post("/plan")
def student_plan(request: StudentPlanRequest):
    return build_student_plan(request.universities, request.profile)
