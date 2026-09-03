from calendar import monthrange
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models import ShiftPreference, User
from schemas.shift_preference import (
    ShiftPreferenceRequest,
    ShiftPreferenceResponse,
)

router = APIRouter(
    prefix="/shift-preferences",
    tags=["shift-preferences"],
)


@router.get(
    "",
    response_model=list[ShiftPreferenceResponse],
)
def get_shift_preferences(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not 1 <= month <= 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12",
        )

    preferences = db.scalars(
        select(ShiftPreference)
        .where(
            ShiftPreference.user_id == current_user.id,
            ShiftPreference.date >= date(year, month, 1),
            ShiftPreference.date <= date(
                year,
                month,
                monthrange(year, month)[1],
            ),
        )
        .order_by(ShiftPreference.date)
    ).all()

    return preferences


@router.put(
    "",
    response_model=list[ShiftPreferenceResponse],
)
def update_shift_preferences(
    data: ShiftPreferenceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not 1 <= data.month <= 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12",
        )

    # リクエストの日付が指定された年月と一致しているか確認
    last_day = monthrange(data.year, data.month)[1]
    start_date = date(data.year, data.month, 1)
    end_date = date(data.year, data.month, last_day)

    for preference in data.preferences:
        if not start_date <= preference.date <= end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Preference date is outside the specified month",
            )

    # 既存データを取得
    existing_preferences = db.scalars(
        select(ShiftPreference).where(
            ShiftPreference.user_id == current_user.id,
            ShiftPreference.date >= start_date,
            ShiftPreference.date <= end_date,
        )
    ).all()

    existing_by_date = {
        preference.date: preference
        for preference in existing_preferences
    }

    # 更新 / 新規作成
    for item in data.preferences:
        existing = existing_by_date.get(item.date)

        if existing:
            existing.early_available = item.early_available
            existing.late_available = item.late_available
        else:
            preference = ShiftPreference(
                user_id=current_user.id,
                date=item.date,
                early_available=item.early_available,
                late_available=item.late_available,
            )
            db.add(preference)

    db.commit()

    # 保存後のデータを取得
    preferences = db.scalars(
        select(ShiftPreference)
        .where(
            ShiftPreference.user_id == current_user.id,
            ShiftPreference.date >= start_date,
            ShiftPreference.date <= end_date,
        )
        .order_by(ShiftPreference.date)
    ).all()

    return preferences