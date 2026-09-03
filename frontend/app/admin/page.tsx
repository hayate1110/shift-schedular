"use client";

import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            管理者メニュー
          </h1>
          <p className="mt-2 text-gray-600">
            シフトや従業員の管理を行います。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/admin/shifts")}
            className="rounded-xl bg-white p-6 text-left shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              シフト作成
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              必要人数を設定して、シフトを自動作成します。
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/users")}
            className="rounded-xl bg-white p-6 text-left shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              従業員管理
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              従業員の追加・編集・削除を行います。
            </p>
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.push("/menu")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← メニューに戻る
          </button>
        </div>
      </div>
    </main>
  );
}
