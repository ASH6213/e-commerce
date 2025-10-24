import { Fragment, useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { getCookie, setCookie } from "cookies-next";

import { useAuth } from "../../context/AuthContext";
import UserIcon from "../../public/icons/UserIcon";
import { api } from "../../lib/api";

export default function UserMenu() {
  const t = useTranslations("Navigation");
  const { user, logout } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>([]);
  const [branchId, setBranchId] = useState<string>("");

  useEffect(() => {
    const existing = (getCookie("branch_id") as string) || "";
    if (existing) setBranchId(existing);
    const loadBranches = async () => {
      try {
        const res = await api.get(`/api/v1/branches`);
        const list = Array.isArray(res.data) ? res.data : [];
        setBranches(list.map((b: any) => ({ id: b.id, name: b.name })));
      } catch (e) {
        console.error("Failed to load branches", e);
      }
    };
    if (user) {
      loadBranches();
    }
  }, [user]);

  const handleBranchChange = () => {
    if (!branchId) return;
    setCookie("branch_id", branchId, { path: "/" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("branch-changed", { detail: { branch_id: branchId } })
      );
    }
    router.reload();
  };

  const handleLogout = () => {
    if (logout) {
      logout();
      router.push("/");
    }
  };

  if (!user) return null;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="focus:outline-none">
        <UserIcon />
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-4 w-72 bg-white border border-gray200 rounded-lg shadow-lg py-2 z-50 focus:outline-none">
        {/* Profile Info */}
        <div className="px-4 py-3 border-b border-gray200">
          <p className="text-sm font-semibold text-gray500">{user.fullname}</p>
          <p className="text-xs text-gray400">{user.email}</p>
        </div>

        {/* My Orders */}
        <Menu.Item>
          {({ active }) => (
            <Link href="/my-orders">
              <a
                className={`${
                  active ? "bg-gray100" : ""
                } block px-4 py-2 text-sm text-gray500`}
              >
                📦 My Orders
              </a>
            </Link>
          )}
        </Menu.Item>

        {/* Branch Selector */}
        <div className="px-4 py-3 border-t border-gray200">
          <label className="block text-xs font-medium text-gray500 mb-2">
            Select Branch
          </label>
          <div className="flex gap-2">
            <select
              className="px-2 py-1.5 border border-gray300 rounded text-sm w-full focus:outline-none focus:border-gray500"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">Choose a branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="px-3 py-1.5 bg-gray500 text-white rounded text-sm hover:bg-gray600 whitespace-nowrap"
              onClick={handleBranchChange}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Logout */}
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={handleLogout}
              className={`${
                active ? "bg-gray100" : ""
              } block w-full text-left px-4 py-2 text-sm text-red-600 border-t border-gray200`}
            >
              🚪 Logout
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
