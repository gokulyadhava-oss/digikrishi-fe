import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useFarmer } from "@/hooks/useFarmer";
import { useFarmerDocuments } from "@/hooks/useFarmerDocuments";
import { useFarmerPlots, usePlotMaps } from "@/hooks/useFarmerPlots";
import {
  updateFarmer,
  deleteFarmer,
  getProfileDownloadUrl,
  getDocumentDownloadUrl,
  deleteProfile,
  deleteDocument,
  uploadProfileImage,
  uploadDocument,
} from "@/api/farmers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToggleCard } from "@/components/ui/toggle-card";
import { PageLoader } from "@/components/ui/loader";
import { DotLoader } from "@/components/ui/dot-loader";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileImage, FileText, CreditCard, Trash2, Download, Upload, Pencil, ChevronDown, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { CascadingDropdownModal } from "@/components/cascading-dropdown-modal";
import { Map as MapIcon } from "lucide-react";
import { PlotMapViewer } from "@/components/PlotMapViewer";
import { fetchPlotAdvisories, type PlotAdvisoriesResponse } from "@/api/advisory";

type TabId = "details" | "documents" | "plots" | "advisory";

const farmerSchema = z.object({
  farmer_code: z.string().min(1),
  name: z.string().min(1),
  mobile: z.string().optional(),
  is_activated: z.boolean().optional(),
  profile_pic_url: z.string().optional(),
  village: z.string().optional(),
  taluka: z.string().optional(),
  district: z.string().optional(),
  bank_name: z.string().optional(),
  ifsc_code: z.string().optional(),
  account_number: z.string().optional(),
  bank_verified: z.boolean().optional(),
  fpc: z.string().optional(),
  shg: z.string().optional(),
  ration_card: z.boolean().optional(),
  aadhaar_number: z.string().optional(),
  pan_number: z.string().optional(),
});

type FarmerForm = z.infer<typeof farmerSchema>;

function getInitials(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

/** Normalized date for skimming: "3 Mar 2026, 6:24 am" */
function formatCreatedAt(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Assam: 1 bigha = 0.33 acres (approx). Bigha from acres. */
const ACRES_PER_BIGHA = 0.33;

function formatLandSize(landSizeValue: string | null | undefined, units: string | null | undefined) {
  if (!landSizeValue) return "—";
  const raw = Number(landSizeValue);
  if (!isFinite(raw) || raw <= 0) return `${landSizeValue} ${units ?? ""}`.trim();

  const unit = (units ?? "").toLowerCase();

  let acres = raw;
  if (unit === "bigha") {
    const bigha = raw;
    const acresFromBigha = bigha * ACRES_PER_BIGHA;
    return `${bigha.toFixed(2)} bigha (${acresFromBigha.toFixed(2)} acre)`;
  }
  if (unit === "hectare" || unit === "hectares") {
    acres = raw * 2.47105;
  } else if (unit === "guntha" || unit === "gunta") {
    acres = raw / 40;
  }

  const bigha = acres / ACRES_PER_BIGHA;
  return `${bigha.toFixed(2)} bigha (${acres.toFixed(2)} acre${acres !== 1 ? "s" : ""})`;
}

interface AdvisorySectionProps {
  farmerId: string | undefined;
  plots: Array<{
    id: string;
    variety: string;
    sowing_date: string;
  }>;
  expandedPlotId: string | null;
}

function AdvisorySection({ farmerId, plots, expandedPlotId }: AdvisorySectionProps) {
  const activePlot =
    plots.find((p) => p.id === expandedPlotId) ??
    plots[0];

  const { data, isLoading, error } = useQuery<PlotAdvisoriesResponse>({
    queryKey: ["farmer", farmerId, "plot", activePlot?.id, "advisories"],
    queryFn: () => fetchPlotAdvisories(farmerId!, activePlot!.id),
    enabled: !!farmerId && !!activePlot,
  });

  if (!activePlot) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <PageLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive">
        Failed to load advisory for this plot.
      </p>
    );
  }

  const { days_since_sowing, advisories } = data;
  const current = advisories.filter((a) => a.is_current_period);
  const others = advisories.filter((a) => !a.is_current_period);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Plot advisory
          </p>
          <p className="text-sm font-medium">
            Variety: <span className="font-semibold">{activePlot.variety || "—"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Sowing date:{" "}
            {activePlot.sowing_date
              ? new Date(activePlot.sowing_date).toLocaleDateString()
              : "—"}
          </p>
        </div>
        {days_since_sowing != null && (
          <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
            <span className="font-semibold text-primary">
              {days_since_sowing} days
            </span>{" "}
            <span className="text-primary/80">since sowing</span>
          </div>
        )}
      </div>

      {advisories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No advisories available for this plot yet.
        </p>
      ) : (
        <div className="space-y-6">
          {current.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Active right now
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {current.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2"
                  >
                    <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
                      {a.stage_name}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {a.activity}
                    </p>
                    {a.start_day != null && a.end_day != null && (
                      <p className="text-xs text-emerald-100">
                        Day {a.start_day}
                        {a.end_day !== a.start_day ? `–${a.end_day}` : ""} after sowing
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full crop timeline
              </p>
              <div className="space-y-2">
                {others.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-md border border-border/60 bg-muted/40 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {a.stage_name}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {a.activity}
                        </p>
                      </div>
                      {a.start_day != null && (
                        <p className="text-xs text-muted-foreground">
                          Day {a.start_day}
                          {a.end_day != null && a.end_day !== a.start_day
                            ? `–${a.end_day}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FarmerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [previewState, setPreviewState] = useState<{ docType: string; url: string } | null>(null);
  const [previewUseIframe, setPreviewUseIframe] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<string | null>(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [fpcShgModalOpen, setFpcShgModalOpen] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const { data: farmer, isLoading, error } = useFarmer(id, activeTab === "details");
  useEffect(() => {
    if (error) toast.error(getErrorMessage(error));
  }, [error]);
  const { data: documents, isLoading: documentsLoading } = useFarmerDocuments(id, activeTab === "documents");
  const { data: plotsRaw = [], isLoading: plotsLoading } = useFarmerPlots(id, activeTab === "plots");
  const [expandedPlotId, setExpandedPlotId] = useState<string | null>(null);
  const plots = useMemo(
    () => [...plotsRaw].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [plotsRaw]
  );
  const { data: plotMaps = [], isLoading: plotMapsLoading } = usePlotMaps(
    id ?? undefined,
    expandedPlotId ?? undefined
  );
  const mutation = useMutation({
    mutationFn: ({ id: farmerId, payload }: { id: string; payload: Parameters<typeof updateFarmer>[1] }) =>
      updateFarmer(farmerId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["farmer", id] });
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", id, "documents"] });
      toast.success((data as { message?: string })?.message ?? "Farmer updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const deleteMutation = useMutation({
    mutationFn: (farmerId: string) => deleteFarmer(farmerId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast.success(data?.message ?? "Farmer deactivated");
      navigate("/farmers");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { isDirty },
  } = useForm<FarmerForm>({
    resolver: zodResolver(farmerSchema),
  });

  useEffect(() => {
    if (!farmer) return;
    reset({
      farmer_code: farmer.farmer_code,
      name: farmer.name,
      mobile: farmer.mobile ?? "",
      is_activated: farmer.is_activated,
      profile_pic_url: farmer.profile_pic_url ?? "",
      village: farmer.FarmerAddress?.village,
      taluka: farmer.FarmerAddress?.taluka,
      district: farmer.FarmerAddress?.district,
      bank_name: farmer.FarmerBank?.bank_name ?? "",
      ifsc_code: farmer.FarmerBank?.ifsc_code ?? "",
      account_number: farmer.FarmerBank?.account_number ?? "",
      bank_verified: farmer.FarmerBank?.verified ?? false,
      fpc: (farmer.FarmerProfileDetail ?? farmer.FarmerProfileDetails)?.fpc,
      shg: (farmer.FarmerProfileDetail ?? farmer.FarmerProfileDetails)?.shg,
      ration_card: (farmer.FarmerProfileDetail ?? farmer.FarmerProfileDetails)?.ration_card,
      aadhaar_number: farmer.FarmerDoc?.aadhaar_number ?? "",
      pan_number: farmer.FarmerDoc?.pan_number ?? "",
    });
  }, [farmer, reset]);

  const profilePicUrl = watch("profile_pic_url");
  const hasProfileKey = (profilePicUrl?.trim() || farmer?.profile_pic_url) || null;
  const { data: profileUrlData } = useQuery({
    queryKey: ["farmer", id, "profile-download-url"],
    queryFn: () => getProfileDownloadUrl(id!),
    enabled: !!id && !!hasProfileKey,
  });
  const rawProfileUrl = profileUrlData?.url ?? null;
  const displayPicUrl =
    rawProfileUrl && !rawProfileUrl.includes("PutObject") && !rawProfileUrl.includes("x-id=PutObject")
      ? rawProfileUrl
      : null;

  const doc = activeTab === "documents" ? documents : farmer?.FarmerDoc;
  const docTypes: { key: keyof NonNullable<typeof doc>; label: string; docType: string }[] = [
    { key: "shg_byelaws_url", label: "SHG Bye-laws", docType: "shg_byelaws" },
    { key: "extract_7_12_url", label: "Land Documents", docType: "extract_7_12" },
    { key: "consent_letter_url", label: "Consent Letter", docType: "consent_letter" },
    { key: "aadhaar_url", label: "Aadhaar", docType: "aadhaar" },
    { key: "pan_url", label: "PAN", docType: "pan" },
    { key: "bank_doc_url", label: "Bank", docType: "bank_doc" },
    { key: "ration_card_url", label: "Ration Card", docType: "ration_card" },
    { key: "survey_form_url", label: "Survey Form", docType: "survey_form" },
    { key: "other_doc_url", label: "Other", docType: "other" },
  ];

  const deleteProfileMutation = useMutation({
    mutationFn: (farmerId: string) => deleteProfile(farmerId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["farmer", id] });
      toast.success(data?.message ?? "Profile picture removed");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const deleteDocumentMutation = useMutation({
    mutationFn: ({ farmerId, docType }: { farmerId: string; docType: string }) =>
      deleteDocument(farmerId, docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmer", id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", id] });
      setPreviewState(null);
      toast.success("Document removed");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  async function openDocumentPreview(docType: string) {
    if (!id) return;
    try {
      const { url } = await getDocumentDownloadUrl(id, docType);
      setPreviewUseIframe(false);
      setPreviewState({ docType, url });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleProfileReupload(file: File) {
    if (!id) return;
    setProfileUploading(true);
    try {
      const overwrite = !!hasProfileKey;
      await uploadProfileImage(id, file, overwrite);
      await queryClient.invalidateQueries({ queryKey: ["farmer", id] });
      const { url: downloadUrl } = await getProfileDownloadUrl(id);
      queryClient.setQueryData(["farmer", id, "profile-download-url"], { url: downloadUrl });
      toast.success(overwrite ? "Profile picture updated" : "Profile picture added");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setProfileUploading(false);
    }
  }

  async function handleDocumentReupload(file: File, docType: string) {
    if (!id) return;
    setDocumentUploading(true);
    try {
      await uploadDocument(id, file, docType);
      queryClient.invalidateQueries({ queryKey: ["farmer", id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", id] });
      setPreviewState(null);
      toast.success("Document updated");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDocumentUploading(false);
    }
  }

  function onSubmit(values: FarmerForm) {
    if (!id) return;
    mutation.mutate({
      id,
      payload: {
        farmer_code: values.farmer_code,
        name: values.name,
        mobile: values.mobile?.trim() || null,
        is_activated: values.is_activated ?? false,
        profile_pic_url: values.profile_pic_url?.trim() || null,
        address: {
          village: values.village,
          taluka: values.taluka,
          district: values.district,
        },
        bankDetails: {
          bank_name: values.bank_name?.trim() || null,
          ifsc_code: values.ifsc_code?.trim() || null,
          account_number: values.account_number?.trim() || null,
          verified: values.bank_verified ?? false,
        },
        profileDetails: {
          fpc: values.fpc,
          shg: values.shg,
          ration_card: values.ration_card,
        },
        docs: {
          aadhaar_number: values.aadhaar_number?.trim() || null,
          pan_number: values.pan_number?.trim() || null,
        },
      },
    });
  }

  if (activeTab === "details" && (isLoading || !farmer)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: back, avatar, name/code, badge, actions */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <Link to="/farmers" className="shrink-0" aria-label="Back to farmers">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <input
          type="file"
          ref={profileFileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && id) handleProfileReupload(f);
            e.target.value = "";
          }}
        />
        <div className="relative group h-24 w-24 shrink-0 sm:h-28 sm:w-28">
          <div className="h-full w-full overflow-hidden rounded-full bg-muted flex items-center justify-center border border-border">
            {displayPicUrl ? (
              <img
                src={displayPicUrl}
                alt={`${farmer?.name ?? "Farmer"} profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground sm:text-3xl"
                aria-hidden
              >
                {getInitials(farmer?.name)}
              </span>
            )}
          </div>
          <div className="absolute inset-0 z-10 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Tooltip content={hasProfileKey ? "Re-upload" : "Add photo"}>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 shrink-0"
                loading={profileUploading}
                onClick={() => profileFileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </Tooltip>
            {hasProfileKey && (
              <Tooltip content="Delete">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 shrink-0"
                  disabled={deleteProfileMutation.isPending}
                  onClick={() => id && deleteProfileMutation.mutate(id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate">{farmer?.name ?? "Farmer"}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{farmer?.farmer_code ?? id}</p>
        </div>
        {farmer && (
          <div className="shrink-0">
            <Tooltip content={farmer.is_activated ? "Farmer account is active" : "Farmer account is inactive (deactivated)"}>
              <Badge
                className={farmer.is_activated ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-muted-foreground/30 bg-muted text-muted-foreground"}
              >
                {farmer.is_activated ? "Active" : "Inactive"}
              </Badge>
            </Tooltip>
          </div>
        )}
        {activeTab === "details" && farmer && (
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Link to="/farmers">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button
              type="button"
              onClick={() => handleSubmit(onSubmit)()}
              loading={mutation.isPending}
              disabled={!isDirty}
            >
              Save changes
            </Button>
          </div>
        )}
      </div>

      <nav
        className="flex border-b border-border"
        role="tablist"
        aria-label="Farmer sections"
      >
        {[
          { id: "details" as TabId, label: "Details", icon: FileText },
          { id: "documents" as TabId, label: "Documents", icon: CreditCard },
          { id: "plots" as TabId, label: "Plots", icon: MapIcon },
          { id: "advisory" as TabId, label: "Advisory", icon: Sparkles },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              className={`
                flex-1 min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-4
                text-sm font-medium transition-colors rounded-t-lg
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${isActive
                  ? "bg-muted/50 text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-b-2 border-transparent"
                }
              `}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="text-center">{label}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === "details" && farmer && (
      <form id="farmer-detail-form" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Basic details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="farmer_code">Farmer code</Label>
                <Input id="farmer_code" {...register("farmer_code")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  {...register("mobile")}
                  placeholder="Not available"
                />
              </div>
              <div className="space-y-2">
                <Label>Ration card</Label>
                <Controller
                  name="ration_card"
                  control={control}
                  render={({ field }) => (
                    <ToggleCard
                      value={!!field.value}
                      onToggle={() => field.onChange(!field.value)}
                      onLabel="Available"
                      offLabel="Not available"
                      ariaLabel="Toggle ration card availability"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Agent</Label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      Assigned agent
                    </span>
                    {farmer.FarmerAgentMaps && farmer.FarmerAgentMaps.length > 0 && farmer.FarmerAgentMaps[0].Agent ? (
                      <span className="font-medium">
                        {farmer.FarmerAgentMaps[0].Agent.email ?? "Agent"}{" "}
                        {farmer.FarmerAgentMaps[0].Agent.mobile
                          ? `· ${farmer.FarmerAgentMaps[0].Agent.mobile}`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </div>
                  {farmer.FarmerAgentMaps && farmer.FarmerAgentMaps[0]?.Agent?.id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/agent/${farmer.FarmerAgentMaps![0]!.Agent!.id}`)}
                    >
                      View agent
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>FPC &amp; SHG</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setFpcShgModalOpen(true)}
                    aria-label="Edit FPC and SHG"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      FPC
                    </p>
                    <p className={watch("fpc") ? "font-medium" : "text-muted-foreground"}>
                      {watch("fpc") || "Not available"}
                    </p>
                  </div>
                  <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      SHG
                    </p>
                    <p className={watch("shg") ? "font-medium" : "text-muted-foreground"}>
                      {watch("shg") || "Not available"}
                    </p>
                  </div>
                </div>
              </div>
              <CascadingDropdownModal
                open={fpcShgModalOpen}
                onOpenChange={setFpcShgModalOpen}
                initialFpc={watch("fpc") ?? ""}
                initialShg={watch("shg") ?? ""}
                saving={mutation.isPending}
                onSave={(fpcVal, shgVal) => {
                  if (!id) return;
                  setValue("fpc", fpcVal, { shouldDirty: true });
                  setValue("shg", shgVal, { shouldDirty: true });
                  mutation.mutate({
                    id,
                    payload: {
                      profileDetails: {
                        fpc: fpcVal || undefined,
                        shg: shgVal || undefined,
                        ration_card: watch("ration_card"),
                      },
                    },
                  });
                }}
              />
              <div className="space-y-2">
                <Label htmlFor="aadhaar_number">Aadhaar number</Label>
                <Input
                  id="aadhaar_number"
                  {...register("aadhaar_number")}
                  placeholder="Not available"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN number</Label>
                <Input
                  id="pan_number"
                  {...register("pan_number")}
                  placeholder="Not available"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="village">Village</Label>
                <Input
                  id="village"
                  {...register("village")}
                  placeholder="Not available"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taluka">Taluka</Label>
                <Input
                  id="taluka"
                  {...register("taluka")}
                  placeholder="Not available"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  {...register("district")}
                  placeholder="Not available"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Bank details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank name</Label>
                <Input
                  id="bank_name"
                  {...register("bank_name")}
                  placeholder="Not available"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC code</Label>
                <Input
                  id="ifsc_code"
                  {...register("ifsc_code")}
                  placeholder="Not available"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account number</Label>
                <Input
                  id="account_number"
                  {...register("account_number")}
                  placeholder="Not available"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank verification</Label>
                <Controller
                  name="bank_verified"
                  control={control}
                  render={({ field }) => (
                    <ToggleCard
                      value={!!field.value}
                      onToggle={() => field.onChange(!field.value)}
                      onLabel="Verified"
                      offLabel="Not verified"
                      ariaLabel="Toggle bank verification"
                    />
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Account actions</CardTitle>
            <CardDescription>Deactivate hides the farmer from active use. They can be reactivated later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={farmer && !farmer.is_activated}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deactivate farmer
              </Button>
              {farmer && !farmer.is_activated && (
                <span className="text-sm text-muted-foreground">This farmer is already deactivated.</span>
              )}
            </div>
          </CardContent>
        </Card>

      </form>
      )}

      {activeTab === "documents" && (
        <Card className="w-full max-w-6xl">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <p className="text-sm text-muted-foreground">Click a card to preview</p>
          </CardHeader>
          <CardContent className="relative flex flex-wrap gap-4">
            {documentUploading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80">
                <DotLoader className="h-8 w-8 text-foreground" />
              </div>
            )}
            {documentsLoading ? (
              <div className="flex min-h-[280px] w-full items-center justify-center">
                <PageLoader message="Loading documents…" />
              </div>
            ) : (
              docTypes.map(({ key, label, docType }) => {
                const hasUrl = !!(doc && key in doc && (doc[key] as string | null | undefined)?.trim());
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (hasUrl) openDocumentPreview(docType);
                      else {
                        setUploadDocType(docType);
                        documentFileInputRef.current?.click();
                      }
                    }}
                    className={`group/doc flex flex-col items-center justify-center gap-2 rounded-lg border p-6 min-w-[140px] transition-colors ${
                      hasUrl
                        ? "border-border bg-muted/50 hover:bg-muted cursor-pointer"
                        : "border-border/60 bg-muted/20 opacity-60 hover:opacity-90 hover:bg-muted/40 hover:border-border cursor-pointer"
                    }`}
                  >
                    {hasUrl ? (
                      <FileImage className="h-10 w-10 text-foreground" />
                    ) : (
                      <Upload className="h-10 w-10 text-muted-foreground group-hover/doc:text-foreground" />
                    )}
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px] group-hover/doc:text-foreground">
                      {hasUrl ? "View" : "Upload"}
                    </span>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "plots" && (
        <Card className="w-full max-w-6xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">

              Plots & Crops
            </CardTitle>
            <CardDescription>
              Crop and land records for this farmer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <PageLoader />
              </div>
            ) : !plots || plots.length === 0 ? (
              <div className="py-12 text-center">
                <MapIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No plots or crops recorded yet</p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Records added via the mobile app will appear here
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-white/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-muted-foreground font-semibold w-8" />
                      <TableHead className="text-muted-foreground font-semibold">Variety</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">Season</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">Land size</TableHead>
                      <TableHead className="text-muted-foreground font-semibold whitespace-nowrap">Created on</TableHead>
                      <TableHead className="text-muted-foreground font-semibold w-28">View plot</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plots.map((plot) => {
                      const isExpanded = expandedPlotId === plot.id;
                      return (
                        <React.Fragment key={plot.id}>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableCell className="w-8 p-1">
                              <button
                                type="button"
                                onClick={() => setExpandedPlotId(isExpanded ? null : plot.id)}
                                className="p-1 rounded hover:bg-white/10 text-muted-foreground"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell className="font-medium">{plot.variety || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-primary/40 text-primary">
                                {plot.season || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatLandSize(plot.land_size_value, plot.units)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {formatCreatedAt(plot.created_at)}
                            </TableCell>
                            <TableCell className="w-28 p-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 border-white/20"
                                onClick={() => setExpandedPlotId(isExpanded ? null : plot.id)}
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                {isExpanded ? "Hide" : "View plot"}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="border-white/10 bg-white/[0.02]">
                              <TableCell colSpan={6} className="p-0 align-top">
                                <div className="px-4 pb-4 pt-3 border-t border-white/10 space-y-4">
                                  {/* Plot details - shown when accordion is opened */}
                                  <div className="grid grid-cols-2 mt-4 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 md:grid-cols-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sowing date</p>
                                      <p className="font-medium">
                                        {plot.sowing_date
                                          ? new Date(plot.sowing_date).toLocaleDateString(undefined, {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                            })
                                          : "—"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sowing method</p>
                                      <p className="font-medium">{plot.sowing_method || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Irrigation</p>
                                      <p className="font-medium">{plot.irrigation_method || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Farming type</p>
                                      <p className="font-medium">{plot.farming_type || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Planting material</p>
                                      <p className="font-medium">{plot.planting_material || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
                                      <p className="font-medium">{plot.address || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Taluka / District</p>
                                      <p className="font-medium">
                                        {[plot.taluka, plot.district].filter(Boolean).join(", ") || "—"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Pincode</p>
                                      <p className="font-medium">{plot.pincode || "—"}</p>
                                    </div>
                                  </div>
                                  {/* Map / coordinates section */}
                                  {plotMapsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <PageLoader />
                                    </div>
                                  ) : plotMaps.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground text-sm">
                                      <MapIcon className="h-10 w-10 mx-auto opacity-50 mb-2" />
                                      <p>No map or coordinates recorded for this plot</p>
                                    </div>
                                  ) : (
                                    <PlotMapViewer plotMaps={plotMaps} farmerId={id ?? undefined} plotId={expandedPlotId ?? undefined} />
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "advisory" && (
        <Card className="w-full max-w-6xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Advisory
            </CardTitle>
            <CardDescription>
              Crop advisory for the plots recorded for this farmer, based on days since sowing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <PageLoader />
              </div>
            ) : !plots || plots.length === 0 ? (
              <div className="py-12 text-center">
                <MapIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No plots recorded yet – advisories will appear once plots are added.</p>
              </div>
            ) : (
              <AdvisorySection farmerId={id} plots={plots} expandedPlotId={expandedPlotId} />
            )}
          </CardContent>
        </Card>
      )}

      <input
        type="file"
        ref={documentFileInputRef}
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const docType = previewState?.docType ?? uploadDocType;
          if (f && docType && id) {
            handleDocumentReupload(f, docType);
            setUploadDocType(null);
          }
          e.target.value = "";
        }}
      />
      <Dialog
        open={!!previewState}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewState(null);
            setPreviewUseIframe(false);
          }
        }}
      >
        <DialogContent className="min-w-[min(88vw,80rem)] max-w-[95vw] w-full max-h-[90vh] flex flex-col p-0 gap-0">
          {previewState && (
            <>
              <div className="flex-1 min-h-0 overflow-auto flex justify-center items-start bg-muted/20">
                {previewUseIframe ? (
                  <iframe
                    src={previewState.url}
                    title="Document preview"
                    className="w-full min-h-[70vh] border-0 max-h-[85vh]"
                  />
                ) : (
                  <img
                    src={previewState.url}
                    alt="Document preview"
                    className="max-w-[85vw] max-h-[85vh] w-auto h-auto object-contain block"
                    onError={() => setPreviewUseIframe(true)}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 p-3 border-t border-border bg-muted/30 shrink-0">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    id && deleteDocumentMutation.mutate({ farmerId: id, docType: previewState.docType })
                  }
                  disabled={deleteDocumentMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => window.open(previewState.url, "_blank")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  loading={documentUploading}
                  onClick={() => {
                    documentFileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Re-upload
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Deactivate farmer"
        description="Are you sure you want to deactivate this farmer? They can be reactivated later."
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => (id ? deleteMutation.mutateAsync(id).then(() => {}) : Promise.resolve())}
      />
    </div>
  );
}
