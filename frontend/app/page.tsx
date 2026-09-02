"use client";

import { useState } from "react";

type ShiftResult = {
  employees: string[];
  shortage: number;
};

type Schedule = {
  [day: string]: {
    [shift: string]: ShiftResult;
  };
};

type Result = {
  success: boolean;
  schedule: Schedule;
  total_shortage: number;
  standard_deviation: number;
};

const dayNames = [
  "月曜日",
  "火曜日",
  "水曜日",
  "木曜日",
  "金曜日",
  "土曜日",
  "日曜日",
];

export default function Home() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<string[]>([
    "A",
    "B",
    "C",
  ]);

  const [newEmployee, setNewEmployee] = useState("");

  const [availability, setAvailability] = useState<
    Record<string, number[]>
  >({
    A: [0, 1, 2, 3, 4],
    B: [0, 2, 4, 5, 6],
    C: [1, 2, 3, 4, 5],
  });

  const [requiredStaff, setRequiredStaff] = useState({
    早番: 2,
    遅番: 2,
  });

  const handleAvailabilityChange = (
    employee: string,
    day: number
  ) => {
    setAvailability((prev) => {
      const currentDays = prev[employee] ?? [];

      const updatedDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);

      return {
        ...prev,
        [employee]: updatedDays,
      };
    });
  };

  const handleAddEmployee = () => {
    const name = newEmployee.trim();

    if (!name) return;

    if (employees.includes(name)) {
      alert("同じ名前の従業員が既に存在します。");
      return;
    }

    setEmployees([...employees, name]);

    setAvailability((prev) => ({
      ...prev,
      [name]: [],
    }));

    setNewEmployee("");
  };

  const handleRemoveEmployee = (employee: string) => {
    setEmployees(
      employees.filter((name) => name !== employee)
    );

    setAvailability((prev) => {
      const updated = { ...prev };

      delete updated[employee];

      return updated;
    });
  };

  const handleGenerate = async () => {
    setLoading(true);

    const data = {
      employees: employees,
      days: [0, 1, 2, 3, 4, 5, 6],
      shifts: ["早番", "遅番"],
      availability: availability,
      required_staff: requiredStaff,
    };

    try {
      const response = await fetch(
        "http://localhost:8000/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result: Result = await response.json();

      console.log(result);

      setResult(result);
    } catch (error) {
      console.error("シフト作成に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8">
        <h1 className="text-3xl font-bold">
          シフト自動作成
        </h1>

        <section className="w-full">
          <h2 className="mb-4 text-xl font-bold">
            従業員
          </h2>

          <div className="flex flex-col gap-2">
            {employees.map((employee) => (
              <div
                key={employee}
                className="flex items-center justify-between rounded-lg border bg-white p-3"
              >
                <span className="font-medium">
                  {employee}
                </span>

                <button
                  onClick={() => handleRemoveEmployee(employee)}
                  className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newEmployee}
              onChange={(e) => setNewEmployee(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddEmployee();
                }
              }}
              placeholder="従業員名"
              className="flex-1 rounded-lg border px-4 py-2"
            />

            <button
              onClick={handleAddEmployee}
              className="rounded-lg bg-zinc-800 px-4 py-2 font-medium text-white"
            >
              追加
            </button>
          </div>
        </section>

        <section className="w-full">
          <h2 className="mb-4 text-xl font-bold">
            勤務可能日
          </h2>

          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-100">
                  <th className="p-3 text-left">
                    従業員
                  </th>

                  {dayNames.map((day) => (
                    <th
                      key={day}
                      className="p-3 text-center"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee}
                    className="border-t"
                  >
                    <td className="p-3 font-medium">
                      {employee}
                    </td>

                    {dayNames.map((_, dayIndex) => (
                      <td
                        key={dayIndex}
                        className="p-3 text-center"
                      >
                        <input
                          type="checkbox"
                          checked={
                            availability[employee]?.includes(
                              dayIndex
                            ) ?? false
                          }
                          onChange={() =>
                            handleAvailabilityChange(
                              employee,
                              dayIndex
                            )
                          }
                          className="h-5 w-5"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="w-full">
          <h2 className="mb-4 text-xl font-bold">
            シフトごとの必要人数
          </h2>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border bg-white p-4">
              <label className="font-medium">
                早番
              </label>

              <input
                type="number"
                min="0"
                value={requiredStaff["早番"]}
                onChange={(e) =>
                  setRequiredStaff((prev) => ({
                    ...prev,
                    早番: Number(e.target.value),
                  }))
                }
                className="w-24 rounded-lg border px-3 py-2 text-center"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-white p-4">
              <label className="font-medium">
                遅番
              </label>

              <input
                type="number"
                min="0"
                value={requiredStaff["遅番"]}
                onChange={(e) =>
                  setRequiredStaff((prev) => ({
                    ...prev,
                    遅番: Number(e.target.value),
                  }))
                }
                className="w-24 rounded-lg border px-3 py-2 text-center"
              />
            </div>
          </div>
        </section>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-fit rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "作成中..." : "シフトを作成"}
        </button>

        {result && (
          <>
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="border-b p-4 text-left">
                      曜日
                    </th>

                    <th className="border-b p-4 text-left">
                      早番
                    </th>

                    <th className="border-b p-4 text-left">
                      遅番
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(result.schedule).map(
                    ([day, shifts]) => (
                      <tr key={day}>
                        <td className="border-b p-4 font-medium">
                          {dayNames[Number(day)]}
                        </td>

                        <td className="border-b p-4">
                          <div>
                            {shifts["早番"].employees.join(", ")}
                          </div>

                          {shifts["早番"].shortage > 0 && (
                            <div className="mt-1 text-sm text-red-500">
                              不足: {shifts["早番"].shortage}人
                            </div>
                          )}
                        </td>

                        <td className="border-b p-4">
                          <div>
                            {shifts["遅番"].employees.join(", ")}
                          </div>

                          {shifts["遅番"].shortage > 0 && (
                            <div className="mt-1 text-sm text-red-500">
                              不足: {shifts["遅番"].shortage}人
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">
                シフト統計
              </h2>

              <div className="flex flex-col gap-2">
                <p>
                  合計不足人数:{" "}
                  <span className="font-bold">
                    {result.total_shortage}人
                  </span>
                </p>

                <p>
                  勤務回数の標準偏差:{" "}
                  <span className="font-bold">
                    {result.standard_deviation.toFixed(2)}回
                  </span>
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}