"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/dashboard/count-up";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  index: number;
  suffix?: string;
  description: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  index,
  suffix,
  description,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="transition-colors duration-200 hover:border-tadius-green-500/30">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-wide text-tadius-gray-muted">
              {label}
            </p>
            <p className="mt-1.5 font-heading text-3xl font-bold text-white">
              <CountUp value={value} />
              {suffix}
            </p>
            <p className="mt-1 font-body text-xs text-tadius-gray-dim">
              {description}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-tadius-green-500/10 ring-1 ring-tadius-green-500/25">
            <Icon className="h-5 w-5 text-tadius-green-500" strokeWidth={2} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
