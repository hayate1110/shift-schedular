from enum import Enum


class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"


class Role(str, Enum):
    USER = "user"
    ADMIN = "admin"


class ShiftType(str, Enum):
    EARLY = "early"
    LATE = "late"