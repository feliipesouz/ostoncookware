import type { CampaignFocal } from "@oston/contracts";
import type { CampaignFocal as DbFocal } from "@oston/database";

const apiToDb: Record<CampaignFocal, DbFocal> = {
  center: "center",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
  "top-left": "top_left",
  "top-right": "top_right",
  "bottom-left": "bottom_left",
  "bottom-right": "bottom_right",
};

const dbToApi = Object.fromEntries(
  Object.entries(apiToDb).map(([api, db]) => [db, api]),
) as Record<DbFocal, CampaignFocal>;

export function focalToDb(value: CampaignFocal): DbFocal {
  return apiToDb[value];
}

export function focalToApi(value: DbFocal): CampaignFocal {
  return dbToApi[value];
}

export function decimalToString(value: { toFixed: (digits: number) => string } | null | undefined) {
  return value ? value.toFixed(2) : null;
}
