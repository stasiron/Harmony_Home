import { useCallback, useRef, useState, type MouseEvent } from "react";
import {
  Check,
  Copy,
  FolderPlus,
  MapPin,
  Trash2,
  Undo2,
} from "lucide-react";
import { FLOOR_PLAN_SRC } from "@/components/chores/MapPinPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_OPTIONS } from "@/config/rooms";
import {
  clearHomeZonesDraft,
  exportHomeZonesJson,
  loadHomeZones,
  saveHomeZonesDraft,
} from "@/config/homeZones";
import { clickToMapPercent, polygonToPointsAttr } from "@/lib/mapGeometry";
import {
  buildZoneTree,
  flattenZoneTree,
  isValidParent,
  newZoneId,
  type ZoneTreeNode,
} from "@/lib/zoneTree";
import type { ChoreRoom, HomeZone, MapPoint } from "@/types";
import { cn } from "@/lib/utils";

const NO_PARENT = "__root__";

function ZoneTreeList({
  nodes,
  depth,
  selectedId,
  onSelect,
}: {
  nodes: ZoneTreeNode[];
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id}>
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
              selectedId === node.id
                ? "bg-primary/15 text-primary"
                : "hover:bg-muted",
            )}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
          >
            <span className="shrink-0 text-xs opacity-70">
              {node.kind === "group" ? "📁" : "▢"}
            </span>
            <span className="truncate font-medium">{node.name}</span>
          </button>
          {node.children.length > 0 && (
            <ZoneTreeList
              nodes={node.children}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </div>
      ))}
    </>
  );
}

export function HomeZoneEditor() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<HomeZone[]>(() => loadHomeZones());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MapPoint[]>([]);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"group" | "space">("group");
  const [newParentId, setNewParentId] = useState<string>(NO_PARENT);
  const [copied, setCopied] = useState(false);

  const selected = zones.find((z) => z.id === selectedId);
  const tree = buildZoneTree(zones);
  const flat = flattenZoneTree(tree);

  const persist = useCallback((next: HomeZone[]) => {
    setZones(next);
    saveHomeZonesDraft(next);
  }, []);

  const addPoint = (e: MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current || newKind !== "space") return;
    if ((e.target as HTMLElement).closest("[data-zone-control]")) return;
    const point = clickToMapPercent(e, mapRef.current);
    setDraft((prev) => [...prev, point]);
  };

  const createZone = () => {
    const name = newName.trim();
    if (!name) return;

    const parentId = newParentId === NO_PARENT ? null : newParentId;
    const id = newZoneId();

    if (newKind === "group") {
      persist([
        ...zones,
        { id, name, parentId, kind: "group" },
      ]);
      setNewName("");
      setSelectedId(id);
      return;
    }

    if (draft.length < 3) return;
    persist([
      ...zones,
      { id, name, parentId, kind: "space", polygon: draft },
    ]);
    setNewName("");
    setDraft([]);
    setSelectedId(id);
  };

  const updateSelected = (patch: Partial<HomeZone>) => {
    if (!selected) return;
    persist(
      zones.map((z) => (z.id === selected.id ? { ...z, ...patch } : z)),
    );
  };

  const removeSelected = () => {
    if (!selected) return;
    const hasChildren = zones.some((z) => z.parentId === selected.id);
    if (hasChildren) return;
    persist(zones.filter((z) => z.id !== selected.id));
    setSelectedId(null);
    setDraft([]);
  };

  const loadPolygonToDraft = () => {
    if (selected?.polygon) setDraft([...selected.polygon]);
  };

  const savePolygonToSelected = () => {
    if (!selected || selected.kind !== "space" || draft.length < 3) return;
    updateSelected({ polygon: draft });
    setDraft([]);
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(exportHomeZonesJson(zones));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <div>
        <h2 className="text-xl font-semibold">Drzewo stref domu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Twórz grupy (np. Strefa dzienna) i przestrzenie z wielokątem (np.
          Kuchnia). Obowiązki mogą wskazywać pinezkę, linię, obszar lub całą
          strefę. Skopiuj JSON → wklej agentowi do{" "}
          <code className="text-xs">content/data/homeZones.json</code>.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-2">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Drzewo
          </p>
          {tree.length === 0 ? (
            <p className="px-2 text-xs text-muted-foreground">Brak stref</p>
          ) : (
            <ZoneTreeList
              nodes={tree}
              depth={0}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-sm font-semibold">Dodaj strefę</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="zone-name">Nazwa</Label>
                <Input
                  id="zone-name"
                  placeholder="np. Strefa dzienna, Kuchnia…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Typ</Label>
                <Select
                  value={newKind}
                  onValueChange={(v) =>
                    setNewKind(v as "group" | "space")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">
                      <span className="flex items-center gap-2">
                        <FolderPlus className="size-4" /> Grupa (folder)
                      </span>
                    </SelectItem>
                    <SelectItem value="space">
                      <span className="flex items-center gap-2">
                        <MapPin className="size-4" /> Przestrzeń (rysuje się)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rodzic</Label>
                <Select value={newParentId} onValueChange={setNewParentId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PARENT}>— Korzeń —</SelectItem>
                    {flat.map(({ zone, depth }) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {"\u00A0".repeat(depth * 2)}
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newKind === "space" && (
              <p className="text-xs text-muted-foreground">
                Kliknij plan poniżej (min. 3 punkty), potem Dodaj strefę.
              </p>
            )}
            <Button
              type="button"
              disabled={
                !newName.trim() ||
                (newKind === "space" && draft.length < 3)
              }
              onClick={createZone}
              data-zone-control
            >
              Dodaj strefę
            </Button>
          </div>

          {selected && (
            <div className="rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold">Edycja: {selected.name}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nazwa</Label>
                  <Input
                    value={selected.name}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Rodzic</Label>
                  <Select
                    value={selected.parentId ?? NO_PARENT}
                    onValueChange={(v) => {
                      const parentId = v === NO_PARENT ? null : v;
                      if (!isValidParent(zones, selected.id, parentId)) return;
                      updateSelected({ parentId });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>— Korzeń —</SelectItem>
                      {flat
                        .filter(({ zone }) => zone.id !== selected.id)
                        .filter(
                          ({ zone }) =>
                            isValidParent(zones, selected.id, zone.id),
                        )
                        .map(({ zone, depth }) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {"\u00A0".repeat(depth * 2)}
                            {zone.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Pokój (opcjonalnie)</Label>
                  <Select
                    value={selected.room ?? NO_PARENT}
                    onValueChange={(v) =>
                      updateSelected({
                        room: v === NO_PARENT ? undefined : (v as ChoreRoom),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>— Brak —</SelectItem>
                      {ROOM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selected.kind === "space" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={loadPolygonToDraft}
                  >
                    Załaduj wielokąt do edycji
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={draft.length < 3}
                    onClick={savePolygonToSelected}
                  >
                    Zapisz wielokąt ({draft.length})
                  </Button>
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={zones.some((z) => z.parentId === selected.id)}
                onClick={removeSelected}
              >
                <Trash2 className="size-4" />
                Usuń strefę
                {zones.some((z) => z.parentId === selected.id) &&
                  " (najpierw usuń dzieci)"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={mapRef}
        role="button"
        tabIndex={0}
        onClick={addPoint}
        onKeyDown={() => {}}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed border-primary/40",
          newKind === "space" || selected?.kind === "space"
            ? "cursor-crosshair"
            : "opacity-80",
        )}
      >
        <img
          src={FLOOR_PLAN_SRC}
          alt=""
          className="pointer-events-none block h-auto w-full select-none"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {zones
            .filter((z) => z.kind === "space" && z.polygon)
            .map((z) => (
              <polygon
                key={z.id}
                points={polygonToPointsAttr(z.polygon!)}
                className={cn(
                  "stroke-primary",
                  selectedId === z.id ? "fill-primary/25" : "fill-primary/10",
                )}
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          {draft.length > 0 && (
            <>
              <polyline
                points={polygonToPointsAttr(draft)}
                className="fill-none stroke-accent"
                strokeWidth={0.5}
                strokeDasharray="1 1"
                vectorEffect="non-scaling-stroke"
              />
              {draft.map((p, i) => (
                <circle
                  key={`${p.x}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={0.8}
                  className="fill-accent"
                />
              ))}
            </>
          )}
        </svg>
      </div>

      {(newKind === "space" || selected?.kind === "space") && (
        <div className="flex flex-wrap gap-2" data-zone-control>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={draft.length === 0}
            onClick={() => setDraft((p) => p.slice(0, -1))}
          >
            <Undo2 className="size-4" /> Cofnij punkt
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraft([])}
          >
            Wyczyść szkic
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={copyJson} disabled={zones.length === 0}>
          <Copy className="size-4" />
          {copied ? "Skopiowano!" : "Kopiuj JSON drzewa"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearHomeZonesDraft();
            setZones([]);
            setSelectedId(null);
            setDraft([]);
          }}
        >
          Wyczyść draft
        </Button>
      </div>
    </section>
  );
}

/** @deprecated */
export const MapZoneEditor = HomeZoneEditor;
