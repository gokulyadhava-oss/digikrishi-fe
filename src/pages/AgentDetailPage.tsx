import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchAgentById } from "@/api/auth";
import { searchFarmers } from "@/api/search";
import { generateFarmerOtp } from "@/api/farmers";
import { useFieldOfficers } from "@/hooks/useFieldOfficers";
import { useAssignFarmerToAgent } from "@/hooks/useFarmers";
import { PageLoader } from "@/components/ui/loader";
import { AssignFarmersModal } from "@/components/AssignFarmersModal";
import { UserCog, Link2, KeyRound, ArrowLeft } from "lucide-react";
import { useState } from "react";

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["agent", id],
    queryFn: () => fetchAgentById(id!),
    enabled: !!id,
  });
  const { data: officers = [] } = useFieldOfficers();
  const assignMutation = useAssignFarmerToAgent();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const assignSearchDebounced = useDebouncedValue(assignSearchQuery, 300);
  const [assignSelectedIds, setAssignSelectedIds] = useState<Set<string>>(new Set());
  const [assignAgentId, setAssignAgentId] = useState<string>(id ?? "__none__");
  const [generatingOtpFor, setGeneratingOtpFor] = useState<string | null>(null);

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["search", "assign-modal", assignSearchDebounced],
    queryFn: () => searchFarmers(assignSearchDebounced.trim(), 1, 80),
    enabled: assignModalOpen && assignSearchDebounced.trim().length > 0,
  });
  const searchResults = searchData?.results ?? [];

  const generateOtpMutation = useMutation({
    mutationFn: generateFarmerOtp,
    onSuccess: (result) => {
      toast.success(`OTP for farmer: ${result.otp}`);
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
      setGeneratingOtpFor(null);
    },
    onError: (err, _farmerId) => {
      toast.error(getErrorMessage(err));
      setGeneratingOtpFor(null);
    },
  });

  const toggleAssignSelected = (farmerId: string) => {
    setAssignSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(farmerId)) next.delete(farmerId);
      else next.add(farmerId);
      return next;
    });
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignSelectedIds.size === 0) return;
    const agentIdToUse = assignAgentId && assignAgentId !== "__none__" ? assignAgentId : null;
    try {
      for (const farmerId of assignSelectedIds) {
        await assignMutation.mutateAsync({ farmerId, agentId: agentIdToUse });
      }
      setAssignSelectedIds(new Set());
      setAssignModalOpen(false);
      setAssignSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
      toast.success(`Assigned ${assignSelectedIds.size} farmer(s)`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openAssignModal = () => {
    setAssignModalOpen(true);
    setAssignSelectedIds(new Set());
    setAssignSearchQuery("");
    setAssignAgentId(id ?? "__none__");
  };

  if (!id) {
    navigate("/agent");
    return null;
  }
  if (isLoading || error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {isLoading && <PageLoader />}
        {error && (
          <p className="text-destructive">
            {error instanceof Error ? error.message : "Failed to load agent"}
          </p>
        )}
      </div>
    );
  }
  if (!data) return null;

  const { agent, farmers } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/agent")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <UserCog className="h-6 w-6" />
              Agent
            </h2>
            <p className="text-muted-foreground">
              {agent.email ?? "—"} · {agent.mobile ?? "—"} ·{" "}
              <span className={agent.is_active ? "text-green-600" : "text-muted-foreground"}>
                {agent.is_active ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>
        <Button onClick={openAssignModal} variant="outline">
          <Link2 className="mr-2 h-4 w-4" />
          Assign farmers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned farmers</CardTitle>
          <CardDescription>
            Farmers assigned to this agent. Use Generate OTP to create a one-time code (cleared every 5 minutes).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {farmers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No farmers assigned. Use &quot;Assign farmers&quot; to add some.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer ID</TableHead>
                  <TableHead>Farmer name</TableHead>
                  <TableHead>FPC</TableHead>
                  <TableHead>Latest OTP</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-sm">{f.farmer_code}</TableCell>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.fpc ?? "—"}</TableCell>
                    <TableCell className="font-mono">{f.otp ?? "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={generatingOtpFor === f.id}
                        onClick={() => {
                          setGeneratingOtpFor(f.id);
                          generateOtpMutation.mutate(f.id);
                        }}
                      >
                        <KeyRound className="mr-1 h-4 w-4" />
                        {generatingOtpFor === f.id ? "…" : "Generate OTP"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
