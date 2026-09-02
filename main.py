from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from scheduler import solve_schedule


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://shift-schedular-one.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScheduleRequest(BaseModel):
    employees: list[str]
    days: list[int]
    shifts: list[str]
    availability: dict[str, list[int]]
    required_staff: dict[str, int]


@app.post("/generate")
def generate_schedule(request: ScheduleRequest):

    result = solve_schedule(
        employees=request.employees,
        days=request.days,
        shifts=request.shifts,
        availability=request.availability,
        required_staff=request.required_staff,
    )

    if result is None:
        return {
            "success": False,
            "message": "条件を満たすシフトを生成できませんでした。",
        }

    return {
        "success": True,
        **result,
    }