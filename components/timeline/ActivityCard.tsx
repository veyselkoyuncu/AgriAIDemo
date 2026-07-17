// ActivityCard — premium single timeline entry
'use client';

import { Calendar, Trash2, MapPin, Sprout, Package } from "lucide-react";
import { getActivityLabel, getActivityConfig } from "@/lib/constants/activity-types";
import ActivityIcon from "./ActivityIcon";

interface ActivityCardProps {
  activity: any;
  onDelete: (id: string) => void;
}

export default function ActivityCard({ activity, onDelete }: ActivityCardProps) {
  const actType = activity.data?.activity_type || "unknown";
  const config = getActivityConfig(actType);

  return (
    <div className="group relative mb-8 last:mb-0">
      <ActivityIcon type={actType} />

      <div className="ml-6 lg:ml-8 rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:border-emerald-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h4 className="text-base font-bold text-zinc-900 dark:text-white">
              {getActivityLabel(actType)}
            </h4>
            {activity.data?.product && (
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <Package className="h-3 w-3" />
                {activity.data.product}
              </span>
            )}
            {activity.data?.quantity && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                {activity.data.quantity}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              {activity.data?.date
                ? new Date(
                    activity.data.date.split(".").reverse().join("-")
                  ).toLocaleDateString("tr-TR")
                : new Date(activity.created_at).toLocaleDateString("tr-TR")}
            </span>
            <button
              onClick={() => onDelete(activity.id)}
              className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/20 dark:hover:text-red-400"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {activity.crops?.farms?.name || "Bilinmeyen Tarla"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {activity.crops?.name || "Bilinmeyen Ürün"}
              </span>
            </span>
          </div>
          {activity.data?.quantity && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {activity.data.quantity}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
