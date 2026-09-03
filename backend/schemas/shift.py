from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from enums import ShiftType


class RequiredStaffItem(BaseModel):
    date: date
    shift_type: ShiftType
    required: int = Field(ge=0)


class ShiftGenerateRequest(BaseModel):
    year: int
    month: int
    required_staff: list[RequiredStaffItem]


class ShiftResponse(BaseModel):
    id: int
    user_id: int
    date: date
    shift_type: ShiftType
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShiftEmployeeResponse(BaseModel):
    user_id: int
    name: str


class ShiftGenerationResult(BaseModel):
    date: date
    shift_type: ShiftType
    employees: list[ShiftEmployeeResponse]
    shortage: int = Field(ge=0)