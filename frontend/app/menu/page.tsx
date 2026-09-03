"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type User = {
  id: number;
  username: string;
  name: string;
  employment_type: "full_time" | "part_time";
  role: "user" | "admin";
};

export default function MenuPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          router.push("/");
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch {
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            シフト管理システム
          </h1>

          <p className="mt-2 text-gray-600">
            {user.name}さん、こんにちは。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/shift-preferences")}
            className="rounded-xl bg-white p-6 text-left shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              シフト希望
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              勤務可能な日を登録します。
            </p>
          </button>

          {user.role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="rounded-xl bg-white p-6 text-left shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                管理者メニュー
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                シフト作成や従業員管理を行います。
              </p>
            </button>
          )}
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-3 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ログアウト
          </button>
        </div>
      </div>
    </main>
  );
}