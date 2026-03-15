import { useMemo } from 'react';
import type { Shelter, DisasterEvent } from '../api/client';
import { isOffline } from '../utils/shelter';

export interface ParishStat {
  parish: string;
  shelterCount: number;
  reportingCount: number;
  criticalCount: number;
  offlineCount: number;
  avgCapacity: number;
  avgWater: number;
  avgFood: number;
  avgMedical: number;
  severityScore: number;
}

export interface NetworkStats {
  totalShelters: number;
  reportingShelters: number;
  criticalCount: number;
  resourceWarningCount: number;
  avgCapacityPercent: number;
  offlineCount: number;
  parishStats: ParishStat[];
}

export const useNetworkStats = (
  shelters: Shelter[],
  activeEvent: DisasterEvent | null,
): NetworkStats => {
  return useMemo(() => {
    const total = shelters.length;
    const reporting = shelters.filter(s => s.latestUpdate && !isOffline(s));
    const reportingCount = reporting.length;

    const criticalCount = reporting.filter(
      s => s.latestUpdate!.capacityLevel >= 4,
    ).length;

    const resourceWarningCount = reporting.filter(s => {
      const u = s.latestUpdate!;
      return u.waterLevel <= 2 || u.foodLevel <= 2 || u.medicalLevel <= 2;
    }).length;

    const avgCapacityPercent =
      reportingCount > 0
        ? Math.round(
            (reporting.reduce((sum, s) => sum + s.latestUpdate!.capacityLevel, 0) /
              reportingCount /
              5) *
              100,
          )
        : 0;

    const offlineCount = shelters.filter(s => isOffline(s)).length;

    // Parish breakdown for affected parishes
    const affected = activeEvent?.affectedParishes ?? [];
    const parishStats: ParishStat[] = affected
      .map(parish => {
        const parishShelters = shelters.filter(s => s.parish === parish);
        const parishReporting = parishShelters.filter(s => s.latestUpdate && !isOffline(s));
        const parishCritical = parishReporting.filter(s => s.latestUpdate!.capacityLevel >= 4);
        const parishOffline = parishShelters.filter(s => isOffline(s));

        const avgCap =
          parishReporting.length > 0
            ? parishReporting.reduce((sum, s) => sum + s.latestUpdate!.capacityLevel, 0) /
              parishReporting.length
            : 0;

        const avgWater =
          parishReporting.length > 0
            ? parishReporting.reduce((sum, s) => sum + s.latestUpdate!.waterLevel, 0) /
              parishReporting.length
            : 0;

        const avgFood =
          parishReporting.length > 0
            ? parishReporting.reduce((sum, s) => sum + s.latestUpdate!.foodLevel, 0) /
              parishReporting.length
            : 0;

        const avgMedical =
          parishReporting.length > 0
            ? parishReporting.reduce((sum, s) => sum + s.latestUpdate!.medicalLevel, 0) /
              parishReporting.length
            : 0;

        const resourceWarnings = parishReporting.filter(s => {
          const u = s.latestUpdate!;
          return u.waterLevel <= 2 || u.foodLevel <= 2 || u.medicalLevel <= 2;
        }).length;

        const severityScore =
          parishCritical.length * 3 + resourceWarnings * 2 + parishOffline.length * 1;

        return {
          parish,
          shelterCount: parishShelters.length,
          reportingCount: parishReporting.length,
          criticalCount: parishCritical.length,
          offlineCount: parishOffline.length,
          avgCapacity: avgCap,
          avgWater,
          avgFood,
          avgMedical,
          severityScore,
        };
      })
      .sort((a, b) => b.severityScore - a.severityScore);

    return {
      totalShelters: total,
      reportingShelters: reportingCount,
      criticalCount,
      resourceWarningCount,
      avgCapacityPercent,
      offlineCount,
      parishStats,
    };
  }, [shelters, activeEvent]);
};
