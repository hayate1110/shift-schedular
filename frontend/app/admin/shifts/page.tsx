"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8000";

type ShiftType = "early" | "late";

type RequiredStaff = {
  date: string;
  early: number;
  late: number;
};

type ShiftEmployee = {
  user_id: number;
  name: string;
};

type ShiftGenerationResult = {
  date: string;
  shift_type: ShiftType;
  employees: ShiftEmployee[];
  shortage: number;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

const formatDate = (year: number, month: number, day: number) => {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
};

export default function AdminShiftsPage() {
  const router = useRouter();

  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [requiredStaff, setRequiredStaff] = useState<RequiredStaff[]>([]);
  const [shifts, setShifts] = useState<ShiftGenerationResult[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  /*
   * 年月が変わったら、その月の日付を作る
   */
  useEffect(() => {
    const days = getDaysInMonth(year, month);

    const newRequiredStaff: RequiredStaff[] = [];

    for (let day = 1; day <= days; day++) {
      newRequiredStaff.push({
        date: formatDate(year, month, day),
        early: 0,
        late: 0,
      });
    }

    setRequiredStaff(newRequiredStaff);

    // 月が変わったら、以前の生成結果を消す
    setShifts([]);
    setError("");
  }, [year, month]);

  /*
   * 必要人数を変更
   */
  const handleChange = (
    date: string,
    shiftType: ShiftType,
    value: number
  ) => {
    setRequiredStaff((current) =>
      current.map((item) =>
        item.date === date
          ? {
              ...item,
              [shiftType]: value,
            }
          : item
      )
    );
  };

  /*
   * シフトを生成
   */
  const handleGenerate = async () => {
    setError("");
    setIsGenerating(true);

    try {
      const requestBody = {
        year,
        month,
        required_staff: requiredStaff.flatMap((item) => [
          {
            date: item.date,
            shift_type: "early",
            required: item.early,
          },
          {
            date: item.date,
            shift_type: "late",
            required: item.late,
          },
        ]),
      };

      const response = await fetch(`${API_URL}/shifts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ?? "シフトの作成に失敗しました"
        );
      }

      const data: ShiftGenerationResult[] = await response.json();

      setShifts(data);

      alert("シフトを作成しました");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("シフトの作成に失敗しました");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            シフト作成
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            各日の必要人数を設定してください。
          </p>
        </div>

        {/* 年月選択 */}
        <div className="mb-6 flex gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
          >
            {Array.from(
              { length: 5 },
              (_, index) => now.getFullYear() - 1 + index
            ).map((value) => (
              <option key={value} value={value}>
                {value}年
              </option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
          >
            {Array.from(
              { length: 12 },
              (_, index) => index + 1
            ).map((value) => (
              <option key={value} value={value}>
                {value}月
              </option>
            ))}
          </select>
        </div>

        {/* 必要人数入力 */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
            <div>日付</div>

            <div className="text-center">
              早番 必要人数
            </div>

            <div className="text-center">
              遅番 必要人数
            </div>
          </div>

          <div>
            {requiredStaff.map((item) => (
              <div
                key={item.date}
                className="grid grid-cols-3 items-center border-b border-gray-100 px-4 py-3 last:border-b-0"
              >
                <div className="text-sm text-gray-900">
                  {item.date}
                </div>

                {/* 早番 */}
                <div className="flex justify-center">
                  <input
                    type="number"
                    min={0}
                    value={item.early}
                    onChange={(e) =>
                      handleChange(
                        item.date,
                        "early",
                        Number(e.target.value)
                      )
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                {/* 遅番 */}
                <div className="flex justify-center">
                  <input
                    type="number"
                    min={0}
                    value={item.late}
                    onChange={(e) =>
                      handleChange(
                        item.date,
                        "late",
                        Number(e.target.value)
                      )
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* エラー */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ボタン */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push("/admin")}
            className="rounded-lg px-4 py-3 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ← 管理者メニューに戻る
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "作成中..." : "シフトを作成"}
          </button>
        </div>

        {/* 生成結果 */}
        {shifts.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              作成されたシフト
            </h2>

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              {/* ヘッダー */}
              <div className="grid grid-cols-[120px_120px_1fr_80px] border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                <div>日付</div>
                <div>早番 / 遅番</div>
                <div>従業員リスト</div>
                <div className="text-center">不足</div>
              </div>

              {/* データ */}
              <div>
                {shifts.map((shift) => (
                  <div
                    key={`${shift.date}-${shift.shift_type}`}
                    className="grid grid-cols-[120px_120px_1fr_80px] items-center border-b border-gray-100 px-4 py-4 text-sm last:border-b-0"
                  >
                    {/* 日付 */}
                    <div className="text-gray-900">
                      {shift.date}
                    </div>

                    {/* シフト種別 */}
                    <div className="text-gray-900">
                      {shift.shift_type === "early"
                        ? "早番"
                        : "遅番"}
                    </div>

                    {/* 従業員 */}
                    <div className="text-gray-900">
                      {shift.employees.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {shift.employees.map((employee) => (
                            <span
                              key={employee.user_id}
                              className="rounded-full bg-gray-100 px-3 py-1 text-sm"
                            >
                              {employee.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          なし
                        </span>
                      )}
                    </div>

                    {/* 不足 */}
                    <div className="text-center">
                      {shift.shortage > 0 ? (
                        <span className="font-semibold text-red-600">
                          {shift.shortage}人
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          —
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              合計 {shifts.length} 件のシフト枠が作成されました。
            </p>
          </div>
        )}
      </div>
    </main>
  );
}