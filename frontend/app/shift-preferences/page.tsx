"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ShiftPreference = {
  id: number;
  date: string;
  early_available: boolean;
  late_available: boolean;
  created_at: string;
  updated_at: string;
};

type Preference = {
  early_available: boolean;
  late_available: boolean;
};

function getDaysInMonth(year: number, month: number): string[] {
  const days = new Date(year, month, 0).getDate();

  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  });
}

function getDayOfWeek(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
}

export default function ShiftPreferencesPage() {
  const router = useRouter();

  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [preferences, setPreferences] = useState<
    Record<string, Preference>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const days = useMemo(
    () => getDaysInMonth(year, month),
    [year, month]
  );

  useEffect(() => {
    const fetchPreferences = async () => {
      setIsLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `${API_URL}/shift-preferences?year=${year}&month=${month}`,
          {
            credentials: "include",
          }
        );

        if (response.status === 401) {
          router.push("/");
          return;
        }

        if (!response.ok) {
          throw new Error("シフト希望の取得に失敗しました");
        }

        const data: ShiftPreference[] = await response.json();

        const initialPreferences: Record<string, Preference> = {};

        for (const day of days) {
          initialPreferences[day] = {
            early_available: false,
            late_available: false,
          };
        }

        for (const preference of data) {
          initialPreferences[preference.date] = {
            early_available: preference.early_available,
            late_available: preference.late_available,
          };
        }

        setPreferences(initialPreferences);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("シフト希望の取得に失敗しました");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [year, month, days, router]);

  const handleChange = (
    date: string,
    shiftType: "early_available" | "late_available"
  ) => {
    setPreferences((current) => ({
      ...current,
      [date]: {
        ...current[date],
        [shiftType]: !current[date]?.[shiftType],
      },
    }));

    setMessage("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/shift-preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          year,
          month,
          preferences: days.map((date) => ({
            date,
            early_available:
              preferences[date]?.early_available ?? false,
            late_available:
              preferences[date]?.late_available ?? false,
          })),
        }),
      });

      if (response.status === 401) {
        router.push("/");
        return;
      }

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ?? "シフト希望の保存に失敗しました"
        );
      }

      const data: ShiftPreference[] = await response.json();

      const savedPreferences: Record<string, Preference> = {};

      for (const day of days) {
        savedPreferences[day] = {
          early_available: false,
          late_available: false,
        };
      }

      for (const preference of data) {
        savedPreferences[preference.date] = {
          early_available: preference.early_available,
          late_available: preference.late_available,
        };
      }

      setPreferences(savedPreferences);
      setMessage("シフト希望を保存しました");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("シフト希望の保存に失敗しました");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/menu")}
            className="mb-4 text-sm text-gray-500 hover:text-gray-900"
          >
            ← メニューに戻る
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            シフト希望
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            勤務可能な日と時間帯を選択してください。
          </p>
        </div>

        {/* Year / Month */}
        <div className="mb-6 flex gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <label
              htmlFor="year"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              年
            </label>

            <select
              id="year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            >
              {Array.from({ length: 5 }, (_, index) => {
                const value = now.getFullYear() - 1 + index;

                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="month"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              月
            </label>

            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            >
              {Array.from({ length: 12 }, (_, index) => {
                const value = index + 1;

                return (
                  <option key={value} value={value}>
                    {value}月
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Preferences */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_100px_100px] border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
            <div>日付</div>
            <div className="text-center">早番</div>
            <div className="text-center">遅番</div>
          </div>

          {isLoading ? (
            <div className="px-4 py-12 text-center text-sm text-gray-500">
              読み込み中...
            </div>
          ) : (
            <div>
              {days.map((date) => {
                const dayOfWeek = getDayOfWeek(date);
                const preference = preferences[date];

                return (
                  <div
                    key={date}
                    className="grid grid-cols-[1fr_100px_100px] items-center border-b border-gray-100 px-4 py-3 last:border-b-0"
                  >
                    <div className="text-sm text-gray-900">
                      {new Date(`${date}T00:00:00`).getDate()}日
                      <span className="ml-2 text-gray-400">
                        ({dayOfWeek})
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={
                          preference?.early_available ?? false
                        }
                        onChange={() =>
                          handleChange(date, "early_available")
                        }
                        className="h-5 w-5 cursor-pointer rounded border-gray-300"
                      />
                    </div>

                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={
                          preference?.late_available ?? false
                        }
                        onChange={() =>
                          handleChange(date, "late_available")
                        }
                        className="h-5 w-5 cursor-pointer rounded border-gray-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save */}
        {!isLoading && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "保存する"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}