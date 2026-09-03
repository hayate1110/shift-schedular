"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8000";

type EmploymentType = "full_time" | "part_time";
type Role = "user" | "admin";

type User = {
  id: number;
  username: string;
  name: string;
  employment_type: EmploymentType;
  role: Role;
  created_at: string;
  updated_at: string;
};

type UserForm = {
  username: string;
  password: string;
  name: string;
  employment_type: EmploymentType;
  role: Role;
};

const emptyForm: UserForm = {
  username: "",
  password: "",
  name: "",
  employment_type: "part_time",
  role: "user",
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState<UserForm>(emptyForm);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  /*
   * 従業員一覧を取得
   */
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/users`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        router.push("/menu");
        return;
      }

      if (!response.ok) {
        throw new Error("従業員一覧の取得に失敗しました");
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("従業員一覧の取得に失敗しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /*
   * 追加フォームを開く
   */
  const handleAdd = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
    setIsFormOpen(true);
  };

  /*
   * 編集フォームを開く
   */
  const handleEdit = (user: User) => {
    setEditingUser(user);

    setForm({
      username: user.username,
      password: "",
      name: user.name,
      employment_type: user.employment_type,
      role: user.role,
    });

    setError("");
    setIsFormOpen(true);
  };

  /*
   * フォームを閉じる
   */
  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
  };

  /*
   * フォーム入力変更
   */
  const handleFormChange = (
    field: keyof UserForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
   * 従業員を追加・編集
   */
  const handleSubmit = async () => {
    setError("");

    if (!form.username || !form.name) {
      setError("ユーザーIDと名前を入力してください");
      return;
    }

    if (!editingUser && !form.password) {
      setError("パスワードを入力してください");
      return;
    }

    setIsSaving(true);

    try {
      let response: Response;

      if (editingUser) {
        const body: Record<string, string> = {
          username: form.username,
          name: form.name,
          employment_type: form.employment_type,
          role: form.role,
        };

        // パスワードが入力されている場合だけ更新
        if (form.password) {
          body.password = form.password;
        }

        response = await fetch(
          `${API_URL}/users/${editingUser.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(body),
          }
        );
      } else {
        response = await fetch(`${API_URL}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(form),
        });
      }

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ??
            (editingUser
              ? "従業員の更新に失敗しました"
              : "従業員の追加に失敗しました")
        );
      }

      await fetchUsers();

      handleCancel();

      alert(
        editingUser
          ? "従業員情報を更新しました"
          : "従業員を追加しました"
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          editingUser
            ? "従業員の更新に失敗しました"
            : "従業員の追加に失敗しました"
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * 従業員を削除
   */
  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(
      `${user.name}さんを削除しますか？\n\nシフト希望や作成済みのシフトも削除されます。`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/users/${user.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ?? "従業員の削除に失敗しました"
        );
      }

      setUsers((current) =>
        current.filter((item) => item.id !== user.id)
      );

      alert("従業員を削除しました");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("従業員の削除に失敗しました");
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              従業員管理
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              従業員の追加・編集・削除を行います。
            </p>
          </div>

          <button
            onClick={handleAdd}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            ＋ 従業員を追加
          </button>
        </div>

        {/* エラー */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 追加・編集フォーム */}
        {isFormOpen && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              {editingUser ? "従業員を編集" : "従業員を追加"}
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* ユーザーID */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  ユーザーID
                </label>

                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    handleFormChange(
                      "username",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  placeholder="ユーザーID"
                />
              </div>

              {/* 名前 */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  名前
                </label>

                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    handleFormChange("name", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  placeholder="名前"
                />
              </div>

              {/* パスワード */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  パスワード
                  {editingUser && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ※変更する場合のみ入力
                    </span>
                  )}
                </label>

                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    handleFormChange(
                      "password",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  placeholder={
                    editingUser
                      ? "変更する場合のみ入力"
                      : "パスワード"
                  }
                />
              </div>

              {/* 雇用形態 */}
              <div>
                <label
                  htmlFor="employment_type"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  雇用形態
                </label>

                <select
                  id="employment_type"
                  value={form.employment_type}
                  onChange={(e) =>
                    handleFormChange(
                      "employment_type",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                >
                  <option value="full_time">
                    正社員
                  </option>
                  <option value="part_time">
                    パート
                  </option>
                </select>
              </div>

              {/* 権限 */}
              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  権限
                </label>

                <select
                  id="role"
                  value={form.role}
                  onChange={(e) =>
                    handleFormChange(
                      "role",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                >
                  <option value="user">
                    一般
                  </option>
                  <option value="admin">
                    管理者
                  </option>
                </select>
              </div>
            </div>

            {/* フォームボタン */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg px-5 py-3 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                キャンセル
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving
                  ? "保存中..."
                  : editingUser
                    ? "更新する"
                    : "追加する"}
              </button>
            </div>
          </div>
        )}

        {/* 従業員一覧 */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {isLoading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              読み込み中...
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              従業員が登録されていません。
            </div>
          ) : (
            <>
              {/* テーブルヘッダー */}
              <div className="hidden grid-cols-[1fr_1.5fr_1fr_1fr_140px] border-b border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700 sm:grid">
                <div>ユーザーID</div>
                <div>名前</div>
                <div>雇用形態</div>
                <div>権限</div>
                <div>操作</div>
              </div>

              {/* 従業員 */}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border-b border-gray-100 px-6 py-5 last:border-b-0"
                >
                  <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr_1fr_1fr_140px] sm:items-center">
                    {/* ユーザーID */}
                    <div>
                      <div className="text-xs text-gray-400 sm:hidden">
                        ユーザーID
                      </div>

                      <div className="text-sm text-gray-900">
                        {user.username}
                      </div>
                    </div>

                    {/* 名前 */}
                    <div>
                      <div className="text-xs text-gray-400 sm:hidden">
                        名前
                      </div>

                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    </div>

                    {/* 雇用形態 */}
                    <div>
                      <div className="text-xs text-gray-400 sm:hidden">
                        雇用形態
                      </div>

                      <div className="text-sm text-gray-700">
                        {user.employment_type ===
                        "full_time"
                          ? "正社員"
                          : "パート"}
                      </div>
                    </div>

                    {/* 権限 */}
                    <div>
                      <div className="text-xs text-gray-400 sm:hidden">
                        権限
                      </div>

                      <div className="text-sm text-gray-700">
                        {user.role === "admin"
                          ? "管理者"
                          : "一般"}
                      </div>
                    </div>

                    {/* 操作 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        編集
                      </button>

                      <button
                        onClick={() => handleDelete(user)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 戻る */}
        <div className="mt-6">
          <button
            onClick={() => router.push("/admin")}
            className="rounded-lg px-4 py-3 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ← 管理者メニューに戻る
          </button>
        </div>
      </div>
    </main>
  );
}