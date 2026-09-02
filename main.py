from schedular import solve_schedule

def main():
    employees = ["A", "B", "C", "D", "E"]

    days = range(7)

    shifts = ["早番", "遅番"]

    availability = {
        # employee: 勤務可能な日
        "A": [0, 1, 2, 3, 4],
        "B": [0, 2, 4, 5, 6],
        "C": [1, 2, 3, 4, 5],
        "D": [0, 1, 5, 6],
        "E": [0, 1, 2, 3, 4, 5, 6],
    }

    required_staff = {
        "早番": 2,
        "遅番": 2,
    }

    result = solve_schedule(
        employees=employees,
        days=days,
        shifts=shifts,
        availability=availability,
        required_staff=required_staff,
    )

    if result is None:
        print("条件を満たすシフトは見つかりませんでした。")
        return

    schedule = result["schedule"]

    for day in days:
        print(f"\nDay {day}")

        for shift in shifts:
            assigned = schedule[day][shift]["employees"]
            shortage = schedule[day][shift]["shortage"]

            print(
                f"  {shift}: {', '.join(assigned)} "
                f"(不足: {shortage}人)"
            )

    print(f"\n合計不足人数: {result['total_shortage']}人")
    print(f"\n従業員の勤務日数の標準偏差: {result['standard_deviation']}")

if __name__ == "__main__":
    main()
