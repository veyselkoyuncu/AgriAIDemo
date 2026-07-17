// ActivityIcon — renders the correct icon + color for each activity type
'use client';

import { LucideProps } from "lucide-react";
import { getActivityConfig } from "@/lib/constants/activity-types";

interface ActivityIconProps {
  type: string | null | undefined;
  size?: 'sm' | 'md';
}

export default function ActivityIcon({ type, size = 'md' }: ActivityIconProps) {
  const config = getActivityConfig(type);
  const Icon = config.icon;
  const dimensions = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const containerDimensions = size === 'sm'
    ? 'h-10 w-10 lg:h-12 lg:w-12'
    : 'h-10 w-10 lg:h-12 lg:w-12';

  return (
    <span
      className={`absolute -left-[23px] lg:-left-[31px] top-1 flex ${containerDimensions} items-center justify-center rounded-full border-4 border-zinc-50 dark:border-zinc-950 shadow-sm ${config.color}`}
    >
      <Icon className={`${dimensions} lg:h-5 lg:w-5`} />
    </span>
  );
}
