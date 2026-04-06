"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Key, Trash2, Shield, User } from "lucide-react";

type UserItem = {
  id: string;
  email: string;
  name: string;
  role: string;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
};

type Owner = { id: string; name: string };

const selectClass = "w-full h-10 rounded-md border border-[#E2DED6] bg-white px-3 text-sm text-[#2D3028] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]";

export function UserManagement({ users, owners }: { users: UserItem[]; owners: Owner[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("ADMIN");

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name"),
        password: form.get("password"),
        role: form.get("role"),
        ownerId: form.get("ownerId") || null,
      }),
    });

    if (res.ok) {
      setAddOpen(false);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create user");
    }
    setLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passwordUser) return;
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: passwordUser.id, password: form.get("password") }),
    });

    if (res.ok) {
      setPasswordUser(null);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to change password");
    }
    setLoading(false);
  }

  async function handleDeleteUser() {
    if (!deleteUser) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteUser.id }),
    });

    if (res.ok) {
      setDeleteUser(null);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete user");
    }
    setLoading(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-[#2D3028]">User Management</CardTitle>
          <Button size="sm" className="bg-[#C9A84C] hover:bg-[#B8963A] text-white" onClick={() => { setAddOpen(true); setError(""); }}>
            <Plus className="mr-2 h-4 w-4" />Add User
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8ECE5] bg-[#FAFAF7]">
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Owner</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE5]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 font-medium text-[#2D3028]">{u.name}</td>
                    <td className="px-4 py-3 text-[#6B7862]">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={u.role === "ADMIN" ? "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30" : "bg-[#7D8B73]/10 text-[#7D8B73] border-[#7D8B73]/30"}>
                        {u.role === "ADMIN" ? <Shield className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#6B7862]">{u.ownerName || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8E9B85] hover:text-[#C9A84C]" onClick={() => { setPasswordUser(u); setError(""); }} title="Change password">
                          <Key className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8E9B85] hover:text-red-600" onClick={() => { setDeleteUser(u); setError(""); }} title="Delete user">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[#2D3028]">Add New User</DialogTitle></DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Name</Label>
              <Input name="name" required placeholder="Full name" className="border-[#E2DED6]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Email</Label>
              <Input name="email" type="email" required placeholder="user@example.com" className="border-[#E2DED6]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Password</Label>
              <Input name="password" type="password" required minLength={6} placeholder="Min 6 characters" className="border-[#E2DED6]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Role</Label>
              <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>
            {role === "OWNER" && (
              <div className="space-y-2">
                <Label className="text-[#6B7862]">Linked Owner</Label>
                <select name="ownerId" required className={selectClass}>
                  <option value="" disabled>Select owner</option>
                  {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <p className="text-xs text-[#8E9B85]">This user will only see data for the selected owner.</p>
              </div>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
            <Button type="submit" className="w-full bg-[#C9A84C] hover:bg-[#B8963A] text-white" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordUser} onOpenChange={(open) => { if (!open) setPasswordUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[#2D3028]">Change Password</DialogTitle></DialogHeader>
          {passwordUser && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-sm text-[#6B7862]">Change password for <strong>{passwordUser.name}</strong> ({passwordUser.email})</p>
              <div className="space-y-2">
                <Label className="text-[#6B7862]">New Password</Label>
                <Input name="password" type="password" required minLength={6} placeholder="Min 6 characters" className="border-[#E2DED6]" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
              <Button type="submit" className="w-full bg-[#C9A84C] hover:bg-[#B8963A] text-white" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[#2D3028]">Delete User</DialogTitle></DialogHeader>
          {deleteUser && (
            <>
              <p className="text-sm text-[#6B7862]">Are you sure you want to delete this user?</p>
              <p className="text-sm font-medium text-[#2D3028]">{deleteUser.name} ({deleteUser.email}) - {deleteUser.role}</p>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
                  {loading ? "Deleting..." : "Delete User"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
