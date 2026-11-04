import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const HID = "flat-1";

let env: RulesTestEnvironment;

const google = (uid: string, email = `${uid}@example.com`) => ({
  firebase: { sign_in_provider: "google.com" },
  email,
  email_verified: true,
});
const anonymous = { firebase: { sign_in_provider: "anonymous" } };

function dbAs(uid: string, token: object = google(uid)) {
  return env.authenticatedContext(uid, token).firestore();
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-harmony-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "households", HID), {
      name: "Flat",
      ownerId: "admin",
    });
    await setDoc(doc(db, "households", HID, "members", "admin"), {
      role: "admin",
    });
    await setDoc(doc(db, "households", HID, "members", "alice"), {
      role: "member",
    });
    await setDoc(doc(db, "households", HID, "members", "tablet"), {
      role: "member",
    });
    await setDoc(doc(db, "households", HID, "chores", "open"), {
      name: "Open",
      createdBy: "alice",
      locked: false,
    });
    await setDoc(doc(db, "households", HID, "chores", "locked"), {
      name: "Locked",
      createdBy: "alice",
      locked: true,
      lastCompleted: "2026-01-01",
    });
    await setDoc(doc(db, "households", HID, "profiles", "p1"), {
      name: "Ala",
      heavyDay: false,
    });
    await setDoc(doc(db, "invites", "CODE1234"), { householdId: HID });
  });
});

describe("prywatność mieszkania", () => {
  it("obcy nie czyta mieszkania ani obowiązków", async () => {
    const db = dbAs("stranger");
    await assertFails(getDoc(doc(db, "households", HID)));
    await assertFails(getDoc(doc(db, "households", HID, "chores", "open")));
  });

  it("anonimowy obcy też nie", async () => {
    const db = dbAs("anon", anonymous);
    await assertFails(getDoc(doc(db, "households", HID)));
  });

  it("domownik czyta", async () => {
    await assertSucceeds(getDoc(doc(dbAs("alice"), "households", HID)));
  });

});

describe("okres przejściowy — stary dokument homeharmony", () => {
  const LEGACY = "homeharmony";

  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "households", LEGACY), {
        userTasks: [],
        progress: {},
        name: "HomeHarmony",
        ownerId: "owner",
        inviteCode: "LEGACY01",
        zones: [],
      });
      await setDoc(doc(db, "households", LEGACY, "chores", "c1"), {
        name: "Chore",
        createdBy: "owner",
      });
    });
  });

  it("stara aplikacja (każdy zalogowany) czyta i zapisuje stare pola", async () => {
    const db = dbAs("tablet", anonymous);
    await assertSucceeds(getDoc(doc(db, "households", LEGACY)));
    await assertSucceeds(
      setDoc(
        doc(db, "households", LEGACY),
        { userTasks: [{ id: "t" }], progress: { t: "2026-11-04" } },
        { merge: true },
      ),
    );
  });

  it("obcy nie zmieni pól nowego modelu", async () => {
    const db = dbAs("stranger");
    for (const patch of [
      { ownerId: "stranger" },
      { inviteCode: "MINE" },
      { zones: [{ id: "x" }] },
      { name: "Hacked" },
    ]) {
      await assertFails(updateDoc(doc(db, "households", LEGACY), patch));
    }
    await assertFails(deleteDoc(doc(db, "households", LEGACY)));
  });

  it("obcy nie zostanie adminem ani nie czyta podkolekcji", async () => {
    const db = dbAs("stranger");
    await assertFails(
      setDoc(doc(db, "households", LEGACY, "members", "stranger"), {
        role: "admin",
      }),
    );
    await assertFails(getDoc(doc(db, "households", LEGACY, "chores", "c1")));
  });

  it("właściciel migruje i jako admin zapisuje nowe pola", async () => {
    const owner = dbAs("owner", google("owner", "stasiron9102@gmail.com"));
    await assertSucceeds(
      setDoc(doc(owner, "households", LEGACY, "members", "owner"), {
        role: "admin",
      }),
    );
    await assertSucceeds(
      setDoc(
        doc(owner, "households", LEGACY),
        { zones: [], migratedAt: "2026-11-04" },
        { merge: true },
      ),
    );
  });
});

describe("tworzenie i dołączanie", () => {
  it("konto tworzy mieszkanie i zostaje adminem w jednym batchu", async () => {
    const db = dbAs("bob");
    const batch = writeBatch(db);
    batch.set(doc(db, "households", "new"), { name: "New", ownerId: "bob" });
    batch.set(doc(db, "households", "new", "members", "bob"), {
      role: "admin",
    });
    await assertSucceeds(batch.commit());
  });

  it("anonimowy nie tworzy mieszkania", async () => {
    const db = dbAs("anon", anonymous);
    await assertFails(
      setDoc(doc(db, "households", "new"), { name: "X", ownerId: "anon" }),
    );
  });

  it("nie można zostać adminem cudzego mieszkania", async () => {
    const db = dbAs("bob");
    await assertFails(
      setDoc(doc(db, "households", HID, "members", "bob"), { role: "admin" }),
    );
  });

  it("dołączenie kodem — także urządzenie bez konta", async () => {
    const db = dbAs("kiosk", anonymous);
    await assertSucceeds(
      setDoc(doc(db, "households", HID, "members", "kiosk"), {
        role: "member",
        inviteCode: "CODE1234",
      }),
    );
  });

  it("zły kod nie wpuszcza", async () => {
    const db = dbAs("bob");
    await assertFails(
      setDoc(doc(db, "households", HID, "members", "bob"), {
        role: "member",
        inviteCode: "WRONG",
      }),
    );
  });

  it("domownik nie nada sobie admina", async () => {
    const db = dbAs("alice");
    await assertFails(
      updateDoc(doc(db, "households", HID, "members", "alice"), {
        role: "admin",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, "households", HID, "members", "alice"), {
        profileId: "p1",
      }),
    );
  });

  it("zaproszenia tworzy tylko admin", async () => {
    await assertFails(
      setDoc(doc(dbAs("alice"), "invites", "NEW"), {
        householdId: HID,
        createdBy: "alice",
      }),
    );
    await assertSucceeds(
      setDoc(doc(dbAs("admin"), "invites", "NEW"), {
        householdId: HID,
        createdBy: "admin",
      }),
    );
  });
});

describe("sprawy całego mieszkania — tylko admin", () => {
  it("strefy i nazwa", async () => {
    await assertFails(
      updateDoc(doc(dbAs("alice"), "households", HID), { zones: [] }),
    );
    await assertSucceeds(
      updateDoc(doc(dbAs("admin"), "households", HID), { zones: [] }),
    );
  });

  it("plan mieszkania", async () => {
    await assertFails(
      setDoc(doc(dbAs("alice"), "households", HID, "assets", "floorPlan"), {
        dataUrl: "x",
      }),
    );
  });

  it("domownicy: dodaje admin, heavy day każdy", async () => {
    const alice = dbAs("alice");
    await assertFails(
      setDoc(doc(alice, "households", HID, "profiles", "p2"), { name: "X" }),
    );
    await assertFails(
      updateDoc(doc(alice, "households", HID, "profiles", "p1"), {
        name: "Hacked",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(alice, "households", HID, "profiles", "p1"), {
        heavyDay: true,
      }),
    );
  });
});

describe("blokada edycji", () => {
  it("niezablokowany edytuje każdy domownik", async () => {
    await assertSucceeds(
      updateDoc(
        doc(dbAs("tablet", anonymous), "households", HID, "chores", "open"),
        {
          name: "Changed",
        },
      ),
    );
  });

  it("zablokowany: obcy domownik nie edytuje ani nie usuwa", async () => {
    const db = dbAs("tablet", anonymous);
    await assertFails(
      updateDoc(doc(db, "households", HID, "chores", "locked"), {
        name: "Changed",
      }),
    );
    await assertFails(
      deleteDoc(doc(db, "households", HID, "chores", "locked")),
    );
  });

  it("zablokowany: każdy może odhaczyć", async () => {
    await assertSucceeds(
      updateDoc(
        doc(dbAs("tablet", anonymous), "households", HID, "chores", "locked"),
        {
          lastCompleted: "2026-11-04",
          lastCompletedBy: "p1",
        },
      ),
    );
  });

  it("zablokowany: twórca i admin edytują", async () => {
    await assertSucceeds(
      updateDoc(doc(dbAs("alice"), "households", HID, "chores", "locked"), {
        name: "By creator",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(dbAs("admin"), "households", HID, "chores", "locked"), {
        name: "By admin",
      }),
    );
  });

  it("zablokować może tylko twórca lub admin", async () => {
    await assertFails(
      updateDoc(
        doc(dbAs("tablet", anonymous), "households", HID, "chores", "open"),
        {
          locked: true,
        },
      ),
    );
    await assertSucceeds(
      updateDoc(doc(dbAs("alice"), "households", HID, "chores", "open"), {
        locked: true,
      }),
    );
  });

  it("nie można podszyć się pod twórcę", async () => {
    const db = dbAs("tablet", anonymous);
    await assertFails(
      setDoc(doc(db, "households", HID, "todos", "t1"), {
        text: "x",
        createdBy: "alice",
      }),
    );
    await assertFails(
      updateDoc(doc(dbAs("alice"), "households", HID, "chores", "open"), {
        createdBy: "admin",
      }),
    );
    await assertSucceeds(
      setDoc(doc(db, "households", HID, "todos", "t1"), {
        text: "x",
        createdBy: "tablet",
      }),
    );
  });

  it("bez konta nie da się zablokować", async () => {
    await assertFails(
      setDoc(doc(dbAs("tablet", anonymous), "households", HID, "todos", "t2"), {
        text: "x",
        createdBy: "tablet",
        locked: true,
      }),
    );
  });
});

describe("prywatne miejsca", () => {
  it("wymagają konta", async () => {
    await assertFails(
      setDoc(
        doc(dbAs("anon", anonymous), "users", "anon", "private", "fridge"),
        {
          items: [],
        },
      ),
    );
    await assertSucceeds(
      setDoc(doc(dbAs("bob"), "users", "bob", "private", "fridge"), {
        items: [],
      }),
    );
    await assertFails(
      getDoc(doc(dbAs("alice"), "users", "bob", "private", "fridge")),
    );
  });
});
