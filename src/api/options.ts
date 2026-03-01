import { api } from "@/lib/axios";

export async function fetchFpcList(): Promise<string[]> {
  const { data } = await api.get<{ fpc: string[] }>("/options/fpc");
  return data.fpc ?? [];
}

/** Always call with fpc filter (from the farmer being viewed). Pass empty string if no FPC. */
export async function fetchShgList(fpc: string | null | undefined): Promise<string[]> {
  const filter = (fpc != null && String(fpc).trim() !== "") ? String(fpc).trim() : "";
  const { data } = await api.get<{ shg: string[] }>("/options/shg", {
    params: { fpc: filter },
  });
  return data.shg ?? [];
}
