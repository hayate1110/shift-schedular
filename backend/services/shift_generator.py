from datetime import date
from calendar import monthrange

from ortools.sat.python import cp_model


def generate_shifts(
    year: int,
    month: int,
    employees: list,
    preferences: dict,
    required_staff: dict,
):
    """
    シフトを最適化して生成する。

    Parameters
    ----------
    year:
        年
    month:
        月
    employees:
        User のリスト
    preferences:
        {
            (user_id, date): {
                "early": bool,
                "late": bool,
            }
        }
    required_staff:
        {
            (date, "early"): 必要人数,
            (date, "late"): 必要人数,
        }

    Returns
    -------
    assignments:
        [
            {
                "user_id": ...,
                "date": ...,
                "shift_type": "early",
            },
            ...
        ]

    shortage:
        {
            (date, "early"): 不足人数,
            ...
        }
    """

    model = cp_model.CpModel()

    last_day = monthrange(year, month)[1]

    dates = [
        date(year, month, day)
        for day in range(1, last_day + 1)
    ]

    shift_types = ["early", "late"]

    # --------------------------------------------------
    # 変数
    # --------------------------------------------------

    x = {}

    for employee in employees:
        for d in dates:
            for shift_type in shift_types:
                x[employee.id, d, shift_type] = model.NewBoolVar(
                    f"x_{employee.id}_{d}_{shift_type}"
                )

    # --------------------------------------------------
    # 制約1
    # 勤務不可の日には割り当てない
    # --------------------------------------------------

    for employee in employees:
        for d in dates:
            preference = preferences.get(
                (employee.id, d),
                {
                    "early": False,
                    "late": False,
                },
            )

            for shift_type in shift_types:
                if not preference[shift_type]:
                    model.Add(
                        x[employee.id, d, shift_type] == 0
                    )

    # --------------------------------------------------
    # 制約2
    # 1人は1日に最大1シフト
    # --------------------------------------------------

    for employee in employees:
        for d in dates:
            model.Add(
                sum(
                    x[employee.id, d, shift_type]
                    for shift_type in shift_types
                )
                <= 1
            )

    # --------------------------------------------------
    # 制約3
    # シフトごとの不足人数
    # --------------------------------------------------

    shortage = {}

    for d in dates:
        for shift_type in shift_types:

            required = required_staff.get(
                (d, shift_type),
                0,
            )

            assigned = sum(
                x[employee.id, d, shift_type]
                for employee in employees
            )

            model.Add(assigned <= required)

            shortage[d, shift_type] = model.NewIntVar(
                0,
                required,
                f"shortage_{d}_{shift_type}",
            )

            model.AddMaxEquality(
                shortage[d, shift_type],
                [
                    required - assigned,
                    0,
                ],
            )

    # --------------------------------------------------
    # 制約4
    # 従業員ごとの勤務日数
    # --------------------------------------------------

    work_days = {}

    for employee in employees:
        work_days[employee.id] = model.NewIntVar(
            0,
            len(dates),
            f"work_days_{employee.id}",
        )

        model.Add(
            work_days[employee.id]
            == sum(
                x[employee.id, d, shift_type]
                for d in dates
                for shift_type in shift_types
            )
        )

    # 最大勤務日数・最小勤務日数
    max_work_days = model.NewIntVar(
        0,
        len(dates),
        "max_work_days",
    )

    min_work_days = model.NewIntVar(
        0,
        len(dates),
        "min_work_days",
    )

    model.AddMaxEquality(
        max_work_days,
        list(work_days.values()),
    )

    model.AddMinEquality(
        min_work_days,
        list(work_days.values()),
    )

    work_day_range = model.NewIntVar(
        0,
        len(dates),
        "work_day_range",
    )

    model.Add(
        work_day_range
        == max_work_days - min_work_days
    )

    # --------------------------------------------------
    # Objective
    # --------------------------------------------------

    total_shortage = sum(shortage.values())

    model.Minimize(
        total_shortage * 1000
        + work_day_range
    )

    # --------------------------------------------------
    # Solve
    # --------------------------------------------------

    solver = cp_model.CpSolver()

    status = solver.Solve(model)

    if status not in (
        cp_model.OPTIMAL,
        cp_model.FEASIBLE,
    ):
        raise RuntimeError(
            "No feasible shift assignment found."
        )

    # --------------------------------------------------
    # 結果
    # --------------------------------------------------

    assignments = []

    for employee in employees:
        for d in dates:
            for shift_type in shift_types:

                if solver.Value(
                    x[employee.id, d, shift_type]
                ):
                    assignments.append(
                        {
                            "user_id": employee.id,
                            "date": d,
                            "shift_type": shift_type,
                        }
                    )

    shortage_result = {
        (d, shift_type): solver.Value(
            shortage[d, shift_type]
        )
        for d in dates
        for shift_type in shift_types
    }

    return assignments, shortage_result