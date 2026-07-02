import floorPlan from "@content/images/apartment-floor-plan.png";

/** Plan mieszkania — plik w content/images/ */
export const FLOOR_PLAN_SRC = floorPlan;

export const FLOOR_PLAN_SIZE = { width: 1024, height: 818 } as const;

/** CSS aspect-ratio value matching the floor plan image */
export const FLOOR_PLAN_ASPECT_RATIO = `${FLOOR_PLAN_SIZE.width} / ${FLOOR_PLAN_SIZE.height}`;
