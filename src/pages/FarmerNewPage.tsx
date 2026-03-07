import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { createFarmer } from "@/api/farmers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { getSampleFarmerData } from "@/constants/sampleFarmer";
import { getErrorMessage } from "@/lib/utils";

const farmerSchema = z.object({
  farmer_code: z.string().min(1, "Farmer code is required"),
  name: z.string().min(1, "Name is required"),
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
  pan_url: z.string().optional(),
  aadhaar_url: z.string().optional(),
  ration_card_url: z.string().optional(),
  survey_form_url: z.string().optional(),
});

type FarmerForm = z.infer<typeof farmerSchema>;

export function FarmerNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createFarmer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast.success((data as { message?: string })?.message ?? "Farmer created");
      navigate(`/farmers/${data.id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: {},
  } = useForm<FarmerForm>({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      farmer_code: "",
      name: "",
      is_activated: false,
    },
  });

  function loadSampleData() {
    reset(getSampleFarmerData() as FarmerForm);
  }

  function onSubmit(values: FarmerForm) {
    mutation.mutate({
      farmer_code: values.farmer_code,
      name: values.name,
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
        pan_url: values.pan_url?.trim() || null,
        aadhaar_url: values.aadhaar_url?.trim() || null,
        ration_card_url: values.ration_card_url?.trim() || null,
        survey_form_url: values.survey_form_url?.trim() || null,
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/farmers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">New farmer</h2>
            <p className="text-muted-foreground">Add a new farmer record</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={loadSampleData}>
          <FileDown className="mr-2 h-4 w-4" />
          Load sample data
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Basic details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="farmer_code">Farmer code *</Label>
                <Input id="farmer_code" {...register("farmer_code")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register("name")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
             
       
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
                <Input id="village" {...register("village")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taluka">Taluka</Label>
                <Input id="taluka" {...register("taluka")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input id="district" {...register("district")} />
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
                <Input id="bank_name" {...register("bank_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC code</Label>
                <Input id="ifsc_code" {...register("ifsc_code")} placeholder="e.g. SBIN0001234" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account number</Label>
                <Input id="account_number" {...register("account_number")} />
              </div>
              <div className="space-y-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bank_verified"
                  {...register("bank_verified")}
                  className="rounded border-input"
                />
                <Label htmlFor="bank_verified">Verified</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Profile (FPC / SHG)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fpc">FPC</Label>
                <Input id="fpc" {...register("fpc")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shg">SHG</Label>
                <Input id="shg" {...register("shg")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-2">
          <Link to="/farmers">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={mutation.isPending}>
            Create farmer
          </Button>
        </div>
      </form>
    </div>
  );
}
