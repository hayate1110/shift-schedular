from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ShiftPreferenceItem(BaseModel):
    date: date
    early_available: bool
    late_available: bool


class ShiftPreferenceRequest(BaseModel):
    year: int
    month: int
    preferences: list[ShiftPreferenceItem]


class ShiftPreferenceResponse(BaseModel):
    id: int
    date: date
    early_available: bool
    late_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)