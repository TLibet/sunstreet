"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";

export function HospitableSettings() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`Sync complete: ${data.created} created, ${data.updated} updated`);
      } else {
        setSyncResult(`Error: ${data.error}`);
      }
    } catch {
      setSyncResult("Sync failed");
    }
    setSyncing(false);
  }

  async function handleTest() {
    setTestResult(null);
    try {
      const res = await fetch("/api/sync?test=true");
      const data = await res.json();
      setTestResult(data.connected ? "success" : "error");
    } catch {
      setTestResult("error");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-[#2D3028]">Hospitable Connection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[#6B7862]">Personal Access Token (PAT)</Label>
          <p className="text-xs text-[#8E9B85]">Set via HOSPITABLE_PAT environment variable in Vercel.</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleTest}>Test Connection</Button>
            {testResult === "success" && <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Connected</Badge>}
            {testResult === "error" && <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[#6B7862]">Manual Sync</Label>
          <div className="flex items-center gap-2">
            <Button onClick={handleSync} disabled={syncing} className="bg-[#C9A84C] hover:bg-[#B8963A] text-white">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
          {syncResult && <p className="text-sm text-[#6B7862]">{syncResult}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
