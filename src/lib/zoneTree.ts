import type { ChoreRoom, HomeZone, MapPoint, Task } from "@/types";

export type ZoneTreeNode = HomeZone & { children: ZoneTreeNode[] };

export function buildZoneTree(zones: HomeZone[]): ZoneTreeNode[] {
  const nodes = new Map<string, ZoneTreeNode>(
    zones.map((z) => [z.id, { ...z, children: [] }]),
  );
  const roots: ZoneTreeNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list: ZoneTreeNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    list.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

export function flattenZoneTree(
  nodes: ZoneTreeNode[],
  depth = 0,
): { zone: HomeZone; depth: number }[] {
  const out: { zone: HomeZone; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ zone: node, depth });
    out.push(...flattenZoneTree(node.children, depth + 1));
  }
  return out;
}

export function collectDescendantIds(
  zoneId: string,
  zones: HomeZone[],
): string[] {
  const ids = [zoneId];
  for (const child of zones.filter((z) => z.parentId === zoneId)) {
    ids.push(...collectDescendantIds(child.id, zones));
  }
  return ids;
}

export function zoneById(
  zones: HomeZone[],
  id: string,
): HomeZone | undefined {
  return zones.find((z) => z.id === id);
}

export function zonePathLabel(zones: HomeZone[], zoneId: string): string {
  const parts: string[] = [];
  let current = zoneById(zones, zoneId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId
      ? zoneById(zones, current.parentId)
      : undefined;
  }
  return parts.join(" › ");
}

export function spaceZonesWithPolygon(zones: HomeZone[]): HomeZone[] {
  return zones.filter((z) => z.kind === "space" && (z.polygon?.length ?? 0) >= 3);
}

export function polygonsForZone(
  zoneId: string,
  zones: HomeZone[],
): { zoneId: string; polygon: MapPoint[] }[] {
  const zone = zoneById(zones, zoneId);
  if (!zone) return [];

  if (zone.kind === "space" && zone.polygon && zone.polygon.length >= 3) {
    return [{ zoneId: zone.id, polygon: zone.polygon }];
  }

  const descendantIds = collectDescendantIds(zoneId, zones);
  return spaceZonesWithPolygon(zones)
    .filter((z) => descendantIds.includes(z.id))
    .map((z) => ({ zoneId: z.id, polygon: z.polygon! }));
}

export function tasksInZoneTree(
  zoneId: string,
  tasks: Task[],
  zones: HomeZone[],
): Task[] {
  const ids = new Set(collectDescendantIds(zoneId, zones));
  return tasks.filter((t) => {
    if (t.zoneId && ids.has(t.zoneId)) return true;
    const zone = zoneById(zones, zoneId);
    if (zone?.room && t.room === zone.room && !t.zoneId) return true;
    return false;
  });
}

export function isValidParent(
  zones: HomeZone[],
  zoneId: string,
  parentId: string | null,
): boolean {
  if (!parentId) return true;
  if (parentId === zoneId) return false;
  const descendants = new Set(collectDescendantIds(zoneId, zones));
  return !descendants.has(parentId);
}

export function newZoneId(): string {
  return `zone-${crypto.randomUUID().slice(0, 8)}`;
}
