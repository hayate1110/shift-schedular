from calendar import monthrange
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from auth.dependencies import require_admin
from database import get_db
from models import Shift, ShiftPreference, User
from schemas.shift import (
    ShiftGenerateRequest,
    ShiftGenerationResult,
)
from services.shift_generator import generate_shifts

router = APIRouter(
    prefix="/shifts",
    tags=["shifts"],
)


@router.post(
    "/generate",
    response_model=list[ShiftGenerationResult],
)
def generate_monthly_shifts(
    data: ShiftGenerateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if not 1 <= data.month <= 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12",
        )

    last_day = monthrange(data.year, data.month)[1]
    start_date = date(data.year, data.month, 1)
    end_date = date(data.year, data.month, last_day)

    # 従業員を取得
    employees = db.scalars(
        select(User).order_by(User.id)
    ).all()

    if not employees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No employees found",
        )

    # シフト希望を取得
    preferences_db = db.scalars(
        select(ShiftPreference).where(
            ShiftPreference.date >= start_date,
            ShiftPreference.date <= end_date,
        )
    ).all()

    preferences = {}

    for preference in preferences_db:
        preferences[(preference.user_id, preference.date)] = {
            "early": preference.early_available,
            "late": preference.late_available,
        }

    # 必要人数を辞書化
    required_staff = {}

    for item in data.required_staff:
        if not start_date <= item.date <= end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Required staff date is outside the specified month",
            )

        key = (item.date, item.shift_type.value)

        if key in required_staff:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate required staff entry",
            )

        required_staff[key] = item.required

    # シフト生成
    assignments, shortage = generate_shifts(
        year=data.year,
        month=data.month,
        employees=employees,
        preferences=preferences,
        required_staff=required_staff,
    )

    # 既存シフトを削除
    db.execute(
        delete(Shift).where(
            Shift.date >= start_date,
            Shift.date <= end_date,
        )
    )

    # 新しいシフトを保存
    shifts = []

    for assignment in assignments:
        shift = Shift(
            user_id=assignment["user_id"],
            date=assignment["date"],
            shift_type=assignment["shift_type"],
        )

        db.add(shift)
        shifts.append(shift)

    db.commit()

    for shift in shifts:
        db.refresh(shift)

    # user_id -> User の辞書
    employee_by_id = {
        employee.id: employee
        for employee in employees
    }

    # 生成結果を「日付 × シフト種別」にまとめる
    results = []

    for current_date in (
        date(data.year, data.month, day)
        for day in range(1, last_day + 1)
    ):
        for shift_type in ["early", "late"]:
            assigned_shifts = [
                shift
                for shift in shifts
                if shift.date == current_date
                and shift.shift_type == shift_type
            ]

            employees_result = [
                {
                    "user_id": shift.user_id,
                    "name": employee_by_id[shift.user_id].name,
                }
                for shift in assigned_shifts
            ]

            results.append(
                {
                    "date": current_date,
                    "shift_type": shift_type,
                    "employees": employees_result,
                    "shortage": shortage.get(
                        (current_date, shift_type),
                        0,
                    ),
                }
            )

    return results