import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

  it("stara aplikacja (każdy zalogowany) czyta, ale nie zapisuje", async () => {
    const db = dbAs("tablet", anonymous);
    await assertSucceeds(getDoc(doc(db, "households", LEGACY)));
    // Stary sync wysyła cały dokument — zablokowany, żeby nie odbijał zapisów
    await assertFails(
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

describe("administrator ogólny", () => {
  const superAdmin = () =>
    dbAs("boss", google("boss", "stasiron9102@gmail.com"));

  it("czyta i edytuje każde mieszkanie bez członkostwa", async () => {
    const db = superAdmin();
    await assertSucceeds(getDoc(doc(db, "households", HID)));
    await assertSucceeds(getDoc(doc(db, "households", HID, "chores", "open")));
    await assertSucceeds(
      updateDoc(doc(db, "households", HID), { zones: [], name: "Renamed" }),
    );
    await assertSucceeds(
      updateDoc(doc(db, "households", HID, "chores", "locked"), {
        name: "By boss",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, "households", HID, "members", "alice"), {
        role: "admin",
      }),
    );
  });

  it("widzi listę wszystkich mieszkań — inni nie", async () => {
    await assertSucceeds(getDocs(collection(superAdmin(), "households")));
    await assertFails(getDocs(collection(dbAs("alice"), "households")));
  });

  it("ustawienia całej aplikacji: czyta każdy, zapisuje tylko on", async () => {
    await assertSucceeds(
      setDoc(doc(superAdmin(), "config", "global"), {
        googleLoginNotice: true,
      }),
    );
    await assertSucceeds(
      getDoc(doc(dbAs("tablet", anonymous), "config", "global")),
    );
    await assertFails(
      setDoc(doc(dbAs("admin"), "config", "global"), {
        googleLoginNotice: false,
      }),
    );
  });

  it("tylko ten adres i tylko zweryfikowany", async () => {
    const other = dbAs("x", google("x", "someone@gmail.com"));
    await assertFails(getDoc(doc(other, "households", HID)));
    const unverified = dbAs("y", {
      ...google("y", "stasiron9102@gmail.com"),
      email_verified: false,
    });
    await assertFails(getDoc(doc(unverified, "households", HID)));
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

  it("własny wpis: dane konta tylko zgodne z tokenem", async () => {
    const db = dbAs("alice");
    const ref = doc(db, "households", HID, "members", "alice");
    await assertSucceeds(
      updateDoc(ref, {
        email: "alice@example.com",
        anonymous: false,
        provider: "google.com",
      }),
    );
    await assertFails(updateDoc(ref, { email: "admin@example.com" }));
    await assertFails(updateDoc(ref, { anonymous: true }));
    await assertFails(updateDoc(ref, { provider: "password" }));
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

describe("role — nadaje twórca albo administrator ogólny", () => {
  const promoteAlice = () =>
    env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(
        doc(ctx.firestore(), "households", HID, "members", "alice"),
        {
          role: "admin",
        },
      );
    });
  const member = (db: ReturnType<typeof dbAs>, uid: string) =>
    doc(db, "households", HID, "members", uid);

  it("twórca nadaje i odbiera administratora", async () => {
    await assertSucceeds(
      updateDoc(member(dbAs("admin"), "alice"), { role: "admin" }),
    );
    await assertSucceeds(
      updateDoc(member(dbAs("admin"), "alice"), { role: "member" }),
    );
  });

  it("drugi administrator nie zmienia ról i nie rusza twórcy", async () => {
    await promoteAlice();
    const alice = dbAs("alice");
    await assertFails(updateDoc(member(alice, "tablet"), { role: "admin" }));
    await assertFails(updateDoc(member(alice, "admin"), { role: "member" }));
    await assertFails(deleteDoc(member(alice, "admin")));
    // ale zwykłe sprawy mieszkania — tak
    await assertSucceeds(
      updateDoc(member(alice, "tablet"), { profileId: "p1" }),
    );
    await assertSucceeds(deleteDoc(member(alice, "tablet")));
  });

  it("nikt poza administratorem ogólnym nie zmieni twórcy mieszkania", async () => {
    await promoteAlice();
    await assertFails(
      updateDoc(doc(dbAs("alice"), "households", HID), { ownerId: "alice" }),
    );
    await assertSucceeds(
      updateDoc(doc(dbAs("alice"), "households", HID), { name: "Nowa" }),
    );
    const boss = dbAs("boss", google("boss", "stasiron9102@gmail.com"));
    await assertSucceeds(updateDoc(member(boss, "admin"), { role: "member" }));
    await assertSucceeds(
      updateDoc(doc(boss, "households", HID), { ownerId: "alice" }),
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

  it("PANIC włącza każdy domownik, ale nic poza tym", async () => {
    const tablet = dbAs("tablet", anonymous);
    await assertSucceeds(
      updateDoc(doc(tablet, "households", HID), {
        panic: { active: true, startedAt: "2026-11-05T10:00:00Z" },
      }),
    );
    await assertSucceeds(
      updateDoc(doc(tablet, "households", HID), { panic: null }),
    );
    await assertFails(
      updateDoc(doc(tablet, "households", HID), { panic: null, name: "X" }),
    );
    await assertFails(
      updateDoc(doc(dbAs("stranger"), "households", HID), { panic: null }),
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

  it("zablokowany na zmianę: odhaczenie przesuwa turę, kolejki nie zmieni", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "households", HID, "chores", "turns"), {
        name: "Turns",
        createdBy: "alice",
        locked: true,
        rotation: ["p1", "p2"],
        rotationTurn: 0,
      });
    });
    const db = dbAs("tablet", anonymous);
    await assertSucceeds(
      updateDoc(doc(db, "households", HID, "chores", "turns"), {
        lastCompleted: "2026-11-05",
        rotationTurn: 1,
      }),
    );
    await assertFails(
      updateDoc(doc(db, "households", HID, "chores", "turns"), {
        rotation: ["p2"],
      }),
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

describe("prywatne obowiązki, zadania i todo", () => {
  const path = (owner: string) =>
    ["households", HID, "private", owner, "todos", "t1"] as const;

  it("autor z kontem zapisuje i czyta swoje", async () => {
    const db = dbAs("alice");
    await assertSucceeds(
      setDoc(doc(db, ...path("alice")), {
        text: "prezent",
        createdBy: "alice",
      }),
    );
    await assertSucceeds(getDoc(doc(db, ...path("alice"))));
  });

  it("nikt inny nie widzi — domownik, tablet ani administrator ogólny", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), ...path("alice")), { text: "x" });
    });
    await assertFails(getDoc(doc(dbAs("admin"), ...path("alice"))));
    await assertFails(getDoc(doc(dbAs("tablet", anonymous), ...path("alice"))));
    await assertFails(
      getDoc(
        doc(
          dbAs("boss", google("boss", "stasiron9102@gmail.com")),
          ...path("alice"),
        ),
      ),
    );
  });

  it("bez konta nie ma prywatnych", async () => {
    await assertFails(
      setDoc(doc(dbAs("tablet", anonymous), ...path("tablet")), { text: "x" }),
    );
  });

  it("prywatne zakupy, lodówka i poradnik — tak; inne listy — nie", async () => {
    for (const name of ["shopping", "fridge", "guides", "guideEntries"]) {
      await assertSucceeds(
        setDoc(
          doc(dbAs("alice"), "households", HID, "private", "alice", name, "s"),
          { name: "x", createdBy: "alice" },
        ),
      );
    }
    await assertFails(
      setDoc(
        doc(
          dbAs("alice"),
          "households",
          HID,
          "private",
          "alice",
          "laundry",
          "s",
        ),
        { name: "x" },
      ),
    );
  });
});

describe("lodówka", () => {
  it("wspólna: domownik dodaje, zablokowaną każdy może zużyć", async () => {
    const ref = (db: ReturnType<typeof dbAs>) =>
      doc(db, "households", HID, "fridge", "milk");
    await assertSucceeds(
      setDoc(ref(dbAs("alice")), {
        name: "Mleko",
        amount: 2,
        unit: "l",
        createdBy: "alice",
        locked: true,
      }),
    );
    await assertSucceeds(updateDoc(ref(dbAs("admin")), { amount: 1 }));
    await assertSucceeds(
      updateDoc(ref(dbAs("tablet", anonymous)), { amount: 0.5 }),
    );
    await assertFails(
      updateDoc(ref(dbAs("tablet", anonymous)), { name: "Woda" }),
    );
  });
});

describe("przepisy", () => {
  const recipe = (over: object = {}) => ({
    name: "Naleśniki",
    createdBy: "alice",
    share: "private",
    sharedWith: {},
    ...over,
  });
  const ref = (db: ReturnType<typeof dbAs>, id = "r1") =>
    doc(db, "households", HID, "recipes", id);

  it("tworzy tylko konto, jako autor", async () => {
    await assertSucceeds(setDoc(ref(dbAs("alice")), recipe()));
    await assertFails(
      setDoc(
        ref(dbAs("tablet", anonymous), "r2"),
        recipe({ createdBy: "tablet" }),
      ),
    );
    await assertFails(setDoc(ref(dbAs("admin"), "r3"), recipe()));
    await assertFails(
      setDoc(ref(dbAs("stranger"), "r4"), recipe({ createdBy: "stranger" })),
    );
  });

  it("prywatny widzi tylko autor — nawet nie administrator ogólny", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(ref(ctx.firestore()), recipe());
    });
    await assertSucceeds(getDoc(ref(dbAs("alice"))));
    await assertFails(getDoc(ref(dbAs("admin"))));
    await assertFails(
      getDoc(ref(dbAs("boss", google("boss", "stasiron9102@gmail.com")))),
    );
  });

  it("udostępniony wszystkim: widzi każdy domownik, także tablet", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(ref(ctx.firestore()), recipe({ share: "all" }));
    });
    await assertSucceeds(getDoc(ref(dbAs("admin"))));
    await assertSucceeds(getDoc(ref(dbAs("tablet", anonymous))));
    await assertFails(getDoc(ref(dbAs("stranger"))));
    const { where, query } = await import("firebase/firestore");
    await assertSucceeds(
      getDocs(
        query(
          collection(dbAs("tablet", anonymous), "households", HID, "recipes"),
          where("share", "==", "all"),
        ),
      ),
    );
  });

  it("udostępniony wybranym: widzą tylko oni (także zapytaniem)", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        ref(ctx.firestore()),
        recipe({ share: "people", sharedWith: { admin: true } }),
      );
    });
    await assertSucceeds(getDoc(ref(dbAs("admin"))));
    await assertFails(getDoc(ref(dbAs("tablet", anonymous))));
    const { where, query } = await import("firebase/firestore");
    await assertSucceeds(
      getDocs(
        query(
          collection(dbAs("admin"), "households", HID, "recipes"),
          where("sharedWith.admin", "==", true),
        ),
      ),
    );
    // Cała kolekcja bez filtra — odmowa (są w niej cudze prywatne)
    await assertFails(
      getDocs(collection(dbAs("admin"), "households", HID, "recipes")),
    );
  });

  it("zmienia i usuwa tylko autor", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(ref(ctx.firestore()), recipe({ share: "all" }));
    });
    await assertFails(updateDoc(ref(dbAs("admin")), { name: "Moje" }));
    await assertFails(deleteDoc(ref(dbAs("admin"))));
    await assertSucceeds(updateDoc(ref(dbAs("alice")), { name: "Placki" }));
    await assertFails(updateDoc(ref(dbAs("alice")), { createdBy: "admin" }));
    await assertSucceeds(deleteDoc(ref(dbAs("alice"))));
  });

  it("mapa udostępnień tylko przy share == people", async () => {
    await assertFails(
      setDoc(
        ref(dbAs("alice")),
        recipe({ share: "private", sharedWith: { admin: true } }),
      ),
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
