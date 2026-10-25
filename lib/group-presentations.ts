import { COUNCIL_TYPES } from "@/lib/constants";
import type { PresentationListItem } from "@/lib/server/presentations";

export type PresentationGroup = {
  type: string;
  items: PresentationListItem[];
};

export function groupPresentations(
  presentations: PresentationListItem[],
  councilTypeFilter: string,
): PresentationGroup[] {
  if (councilTypeFilter !== "all") {
    return [{ type: councilTypeFilter, items: presentations }];
  }

  const groups = new Map<string, PresentationListItem[]>();
  for (const type of COUNCIL_TYPES) {
    groups.set(type, []);
  }
  for (const presentation of presentations) {
    const list = groups.get(presentation.councilType) ?? [];
    list.push(presentation);
    groups.set(presentation.councilType, list);
  }

  return Array.from(groups.entries())
    .filter(([, items]) => items.length > 0)
    .map(([type, items]) => ({ type, items }));
}
