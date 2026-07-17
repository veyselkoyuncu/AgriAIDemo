// ActivityCard — single timeline entry
'use client';

import { Calendar, Trash2 } from "lucide-react";
import { getActivityLabel } from "@/lib/constants/activity-types";
import ActivityIcon from "./ActivityIcon";

interface ActivityCardProps {
  activity: any; // ActivityRow from Supabase
  onDelete: (id: string) => void;
}

export default function ActivityCard({ activity, onDelete }: ActivityCardProps) {
  const actType = activity.data?.activity_type || "unknown";

  return (
    <div className="relative mb-8 last:mb-0">
      <ActivityIcon type={actType} />

      <div className="ml-6 lg:ml-8 rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-sm hover:shadow-md transition dark:border-zinc-800/50 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-zinc-900 dark:text-white">
              {getActivityLabel(actType)}
            </h4>
            {activity.data?.product && (
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                {activity.data.product}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              {activity.data?.date
                ? new Date(
                    activity.data.date.split(".").reverse().join("-")
                  ).toLocaleDateString("tr-TR")
                : new Date(activity.created_at).toLocaleDateString("tr-TR")}
            </span>
            <button
              onClick={() => onDelete(activity.id)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <span className="font-semibold text-zinc-400 mr-1.5">Tarla:</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {activity.crops?.farms?.name || "Bilinmeyen Tarla"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-zinc-400 mr-1.5">Ürün:</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {activity.crops?.name || "Bilinmeyen Ürün"}
            </span>
          </div>
          {activity.data?.quantity && (
            <div>
              <span className="font-semibold text-zinc-400 mr-1.5">Miktar:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {activity.data.quantity}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
