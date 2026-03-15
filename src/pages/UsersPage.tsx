import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuthStore } from "@/stores/authStore";
import { useFieldOfficers, useCreateFieldOfficer } from "@/hooks/useFieldOfficers";
import { useAssignFarmerToAgent } from "@/hooks/useFarmers";
import { searchFarmers } from "@/api/search";
import { PageLoader } from "@/components/ui/loader";
import { AssignFarmersModal } from "@/components/AssignFarmersModal";
import { useNavigate } from "react-router-dom";
import { UserPlus, UserCog, Link2 } from "lucide-react";

export function AgentsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isTenant = user?.role === "TENANT";

  const { data: officers = [], isLoading: officersLoading } = useFieldOfficers();
  const createMutation = useCreateFieldOfficer();
  const assignMutation = useAssignFarmerToAgent();

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addOfficerModalOpen, setAddOfficerModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const assignSearchDebounced = useDebouncedValue(assignSearchQuery, 300);
  const [assignSelectedIds, setAssignSelectedIds] = useState<Set<string>>(new Set());
  const [assignAgentId, setAssignAgentId] = useState<string>("__none__");

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["search", "assign-modal", assignSearchDebounced],
    queryFn: () => searchFarmers(assignSearchDebounced.trim(), 1, 80),
    enabled: assignModalOpen && assignSearchDebounced.trim().length > 0,
  });
  const searchResults = searchData?.results ?? [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword) return;
    createMutation.mutate(
      { email: newEmail.trim(), password: newPassword },
      {
        onSuccess: (data: { message?: string }) => {
          setNewEmail("");
          setNewPassword("");
          setAddOfficerModalOpen(false);
          toast.success(data?.message ?? "Agent created");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const toggleAssignSelected = (id: string) => {
    setAssignSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignSelectedIds.size === 0) return;
    const agentId = assignAgentId && assignAgentId !== "__none__" ? assignAgentId : null;
    try {
      for (const farmerId of assignSelectedIds) {
        await assignMutation.mutateAsync({ farmerId, agentId });
      }
      setAssignSelectedIds(new Set());
      setAssignModalOpen(false);
      setAssignSearchQuery("");
      toast.success(`Assigned ${assignSelectedIds.size} farmer(s)`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openAssignModal = () => {
    setAssignModalOpen(true);
    setAssignSelectedIds(new Set());
    setAssignSearchQuery("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
          <p className="text-muted-foreground">
            Tenant: <span className="font-medium text-foreground">{user?.Tenant?.name ?? "—"}</span>. Manage agents and assign farmers to them.
          </p>
        </div>
        {isTenant && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button onClick={() => setAddOfficerModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add agent
            </Button>
            <Button onClick={openAssignModal} variant="outline">
              <Link2 className="mr-2 h-4 w-4" />
              Assign farmers
            </Button>
          </div>
        )}
      </div>

      {/* List agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Agents
          </CardTitle>
          <CardDescription>
            Agents linked to your tenant. Only tenants can add new agents and assign farmers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {officersLoading ? (
            <PageLoader />
          ) : officers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No agents yet. Add one below (tenant only).
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {officers.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => navigate(`/agent/${o.id}`)}
                  className="group flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-left shadow-sm transition hover:border-primary/50 hover:bg-card"
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserCog className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate max-w-[180px]">
                          {o.email ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {o.mobile ?? "No mobile"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                        o.is_active
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                          : "border-muted-foreground/30 bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {o.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5 opacity-70" />
                      <span>Tap to view details</span>
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-primary/80 group-hover:text-primary">
                      View agent →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add agent modal */}
      <Dialog open={addOfficerModalOpen} onOpenChange={setAddOfficerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add agent
            </DialogTitle>
            <DialogDescription>
              Create a new agent for your tenant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fo-email">Email</Label>
              <Input
                id="fo-email"
                type="email"
                placeholder="agent@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fo-password">Password</Label>
              <Input
                id="fo-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOfficerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create agent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AssignFarmersModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        officers={officers}
        searchQuery={assignSearchQuery}
        onSearchQueryChange={setAssignSearchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        selectedIds={assignSelectedIds}
        onToggleSelected={toggleAssignSelected}
        agentId={assignAgentId}
        onAgentIdChange={setAssignAgentId}
        onSubmit={handleAssignSubmit}
        isSubmitting={assignMutation.isPending}
        submitError={assignMutation.isError ? (assignMutation.error as Error) : null}
      />
    </div>
  );
}
