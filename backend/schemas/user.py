from datetime import datetime
from enums import EmploymentType, Role

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)
    name: str = Field(min_length=1)
    employment_type: EmploymentType
    role: Role


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=1)
    password: str | None = Field(default=None, min_length=1)
    name: str | None = Field(default=None, min_length=1)
    employment_type: EmploymentType | None = None
    role: Role | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    employment_type: EmploymentType
    role: Role
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)