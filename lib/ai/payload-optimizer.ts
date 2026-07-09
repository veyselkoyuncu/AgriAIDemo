export interface OptimizedFarmerStatus {
  name: string;
  farms: string[];
  crops: { name: string; farm_name: string }[];
}

export function optimizeFarmerStatus(farmerStatus: any): OptimizedFarmerStatus {
  if (!farmerStatus) return { name: "", farms: [], crops: [] };
  return {
    name: farmerStatus.name || "",
    farms: farmerStatus.farms?.map((f: any) => f.name) || [],
    crops: farmerStatus.crops?.map((c: any) => ({
      name: c.name,
      farm_name: c.farm_name
    })) || []
  };
}

export function optimizeHistory(history: any[]): any[] {
  if (!history || !Array.isArray(history)) return [];
  return history.map(h => {
    return {
      type: h.activity_data?.activity_type || "faaliyet",
      farm: h.farm_name || h.activity_data?.farm_name || "",
      crop: h.crop_name || h.activity_data?.crop_name || "",
      product: h.activity_data?.product || null,
      quantity: h.activity_data?.quantity || null,
      date: h.activity_data?.date || h.created_at?.slice(0, 10) || ""
    };
  });
}
