from ortools.sat.python import cp_model
import math

def solve_schedule(
    employees,
    days,
    shifts,
    availability,
    required_staff,
):
    model = cp_model.CpModel()

    # ========================================
    # Decision Variables
    # ========================================

    # x[employee, day, shift]
    #
    # 1: その従業員をその日のそのシフトに配置する
    # 0: 配置しない
    x = {}

    for employee in employees:
        for day in days:
            for shift in shifts:
                x[employee, day, shift] = model.NewBoolVar(
                    f"x_{employee}_{day}_{shift}"
                )

    # ========================================
    # Soft Constraint Variables
    # ========================================

    # shortage[day, shift]
    #
    # そのシフトの不足人数
    shortage = {}

    for day in days:
        for shift in shifts:
            shortage[day, shift] = model.NewIntVar(
                0,
                required_staff[shift],
                f"shortage_{day}_{shift}",
            )

    # work_count[employee]
    #
    # その従業員の勤務日数
    work_count = {}

    for employee in employees:
        work_count[employee] = model.NewIntVar(
            0,
            len(days),
            f"work_count_{employee}",
        )

    # scaled_deviation[employee]
    # 
    # その従業員の勤務日数の偏差をスケーリングした値
    # scaled_deviation[employee] = N * work_count[employee] - total_work
    scaled_deviation = {}

    num_employees = len(employees)

    for employee in employees:
        # N * 勤務回数 - 総勤務回数
        scaled_deviation[employee] = model.NewIntVar(
            -len(days) * num_employees,
            len(days) * num_employees,
            f"deviation_{employee}",
        )

    # squared_deviation[employee]
    # 
    # その従業員の勤務日数の偏差の二乗
    squared_deviation = {}

    max_deviation = len(days) * num_employees

    for employee in employees:
        squared_deviation[employee] = model.NewIntVar(
            0,
            max_deviation**2,
            f"squared_deviation_{employee}",
        )

    # ========================================
    # Hard Constraints
    # ========================================

    # ----------------------------------------
    # 制約1:
    # 勤務可能な日にしか割り当てない
    # ----------------------------------------

    for employee in employees:
        for day in days:
            if day not in availability[employee]:
                for shift in shifts:
                    model.Add(
                        x[employee, day, shift] == 0
                    )

    # ----------------------------------------
    # 制約2:
    # 1人は1日に最大1シフト
    # ----------------------------------------

    for employee in employees:
        for day in days:
            model.Add(
                sum(
                    x[employee, day, shift]
                    for shift in shifts
                )
                <= 1
            )

    # ========================================
    # Soft Constraints
    # ========================================

    # ----------------------------------------
    # 制約3:
    # 必要人数に対する不足人数を計算
    # ----------------------------------------

    for day in days:
        for shift in shifts:

            assigned_count = sum(
                x[employee, day, shift]
                for employee in employees
            )

            # 配置人数 + 不足人数 = 必要人数
            model.Add(
                assigned_count
                + shortage[day, shift]
                == required_staff[shift]
            )

    # ----------------------------------------
    # 制約4:
    # 従業員の勤務日数の分散を計算
    # ----------------------------------------

    for employee in employees:
        model.Add(
            work_count[employee]
            == sum(
                x[employee, day, shift]
                for day in days
                for shift in shifts
            )
        )

    total_work = sum(work_count.values())

    for employee in employees:
        model.Add(
            scaled_deviation[employee]
            == num_employees * work_count[employee]
            - total_work
        )

    for employee in employees:
        model.AddMultiplicationEquality(
            squared_deviation[employee],
            [
                scaled_deviation[employee],
                scaled_deviation[employee],
            ],
        )

    # ========================================
    # Objective
    # ========================================

    # 全シフトの不足人数を最小化
    total_shortage = sum(shortage.values())

    # 勤務日数の分散を最小化
    imbalance = sum(squared_deviation.values())

    model.Minimize(
        total_shortage * 1000
        + imbalance
    )

    # ========================================
    # Solve
    # ========================================

    solver = cp_model.CpSolver()

    status = solver.Solve(model)

    # ========================================
    # Result
    # ========================================

    if status not in (
        cp_model.OPTIMAL,
        cp_model.FEASIBLE,
    ):
        return None

    schedule = {}

    for day in days:
        schedule[day] = {}

        for shift in shifts:

            assigned = [
                employee
                for employee in employees
                if solver.Value(
                    x[employee, day, shift]
                )
                == 1
            ]

            schedule[day][shift] = {
                "employees": assigned,
                "shortage": solver.Value(
                    shortage[day, shift]
                ),
            }

    imbalance_value = sum(
        solver.Value(squared_deviation[employee])
        for employee in employees
    )

    variance = (
        imbalance_value / len(employees) ** 3
    )

    standard_deviation = math.sqrt(variance)

    return {
        "schedule": schedule,
        "total_shortage": solver.Value(
            total_shortage
        ),
        "standard_deviation": standard_deviation,
    }