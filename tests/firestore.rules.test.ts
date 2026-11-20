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
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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

  it("po okresie przejściowym nikt obcy go nie czyta ani nie zapisuje", async () => {
    const db = dbAs("tablet", anonymous);
    await assertFails(getDoc(doc(db, "households", LEGACY)));
    await assertFails(getDoc(doc(dbAs("stranger"), "households", LEGACY)));
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

describe("kod zaproszenia i własność", () => {
  const invite = (db: ReturnType<typeof dbAs>) =>
    doc(db, "households", HID, "admin", "invite");
  const makeAliceAdmin = () =>
    env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(
        doc(ctx.firestore(), "households", HID, "members", "alice"),
        { role: "admin" },
      );
    });

  it("kod czyta i zapisuje tylko administrator", async () => {
    await assertSucceeds(setDoc(invite(dbAs("admin")), { code: "CODE1234" }));
    await assertSucceeds(getDoc(invite(dbAs("admin"))));
    await assertFails(getDoc(invite(dbAs("alice"))));
    await assertFails(setDoc(invite(dbAs("alice")), { code: "MINE" }));
  });

  it("kodu nie da się wpisać do dokumentu mieszkania, stary wolno usunąć", async () => {
    const admin = dbAs("admin");
    await assertFails(
      updateDoc(doc(admin, "households", HID), { inviteCode: "CODE1234" }),
    );
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), "households", HID), {
        inviteCode: "OLD",
      });
    });
    await assertSucceeds(
      updateDoc(doc(admin, "households", HID), { name: "X" }),
    );
    await assertSucceeds(
      updateDoc(doc(admin, "households", HID), { inviteCode: deleteField() }),
    );
  });

  it("domownik wybiera swój profil, ale nie przejmie kolejnego", async () => {
    const ref = doc(dbAs("alice"), "households", HID, "members", "alice");
    await assertSucceeds(updateDoc(ref, { profileId: "p1" }));
    await assertFails(updateDoc(ref, { profileId: "p2" }));
    await assertSucceeds(updateDoc(ref, { profileId: null }));
  });

  it("twórca wychodzi dopiero po przekazaniu mieszkania administratorowi", async () => {
    const admin = dbAs("admin");
    const own = doc(admin, "households", HID, "members", "admin");
    await assertFails(deleteDoc(own));
    await assertFails(
      updateDoc(doc(admin, "households", HID), { ownerId: "alice" }),
    );
    await makeAliceAdmin();
    await assertFails(
      updateDoc(doc(dbAs("alice"), "households", HID), { ownerId: "alice" }),
    );
    await assertSucceeds(
      updateDoc(doc(admin, "households", HID), { ownerId: "alice" }),
    );
    await assertSucceeds(deleteDoc(own));
  });

  it("mieszkanie usuwa tylko twórca — razem ze swoim wpisem", async () => {
    await makeAliceAdmin();
    await assertFails(deleteDoc(doc(dbAs("alice"), "households", HID)));
    const admin = dbAs("admin");
    const batch = writeBatch(admin);
    batch.delete(doc(admin, "households", HID, "members", "admin"));
    batch.delete(doc(admin, "households", HID));
    await assertSucceeds(batch.commit());
  });

  it("dokument konta: e-mail tylko zgodny z tokenem", async () => {
    const db = dbAs("alice");
    await assertSucceeds(
      setDoc(doc(db, "users", "alice"), { email: "alice@example.com" }),
    );
    await assertFails(
      setDoc(doc(db, "users", "alice"), { email: "boss@example.com" }),
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
    batch.set(
      doc(db, "rateLimits", "bob"),
      { household: serverTimestamp() },
      { merge: true },
    );
    await assertSucceeds(batch.commit());
  });

  it("drugie mieszkanie w ciągu minuty i bez znacznika — odmowa", async () => {
    const db = dbAs("bob");
    const create = (id: string, stamp: boolean) => {
      const batch = writeBatch(db);
      batch.set(doc(db, "households", id), { name: id, ownerId: "bob" });
      batch.set(doc(db, "households", id, "members", "bob"), { role: "admin" });
      if (stamp) {
        batch.set(
          doc(db, "rateLimits", "bob"),
          { household: serverTimestamp() },
          { merge: true },
        );
      }
      return batch.commit();
    };
    await assertFails(create("a", false));
    await assertSucceeds(create("b", true));
    await assertFails(create("c", true));
    // Znacznika nie da się cofnąć ani usunąć
    await assertFails(deleteDoc(doc(db, "rateLimits", "bob")));
    await assertFails(
      setDoc(doc(db, "rateLimits", "bob"), {
        household: new Date("2020-01-01"),
      }),
    );
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

  it("dołączenie kodem — urządzenie bez konta tylko jako „urządzenie”", async () => {
    const ref = doc(
      dbAs("kiosk", anonymous),
      "households",
      HID,
      "members",
      "kiosk",
    );
    await assertFails(setDoc(ref, { role: "member", inviteCode: "CODE1234" }));
    await assertSucceeds(
      setDoc(ref, { role: "device", inviteCode: "CODE1234" }),
    );
  });

  it("konto nie dołącza jako urządzenie ani gość", async () => {
    const ref = doc(dbAs("bob"), "households", HID, "members", "bob");
    await assertFails(setDoc(ref, { role: "device", inviteCode: "CODE1234" }));
    await assertFails(setDoc(ref, { role: "guest", inviteCode: "CODE1234" }));
  });

  it("konto dołącza kodem dopiero z potwierdzonym e-mailem", async () => {
    const passwordAccount = (verified: boolean) => ({
      firebase: { sign_in_provider: "password" },
      email: "bob@example.com",
      email_verified: verified,
    });
    const entry = {
      uid: "bob",
      role: "member",
      profileId: null,
      anonymous: false,
      displayName: "Bob",
      email: "bob@example.com",
      provider: "password",
      joinedAt: "2026-11-18T10:00:00Z",
      inviteCode: "CODE1234",
    };
    const ref = (verified: boolean) =>
      doc(
        dbAs("bob", passwordAccount(verified)),
        "households",
        HID,
        "members",
        "bob",
      );
    await assertFails(setDoc(ref(false), entry));
    await assertSucceeds(setDoc(ref(true), entry));
  });

  it("nie dołączy z cudzym e-mailem ani obcymi polami", async () => {
    const ref = doc(dbAs("bob"), "households", HID, "members", "bob");
    await assertFails(
      setDoc(ref, {
        role: "member",
        inviteCode: "CODE1234",
        email: "admin@example.com",
      }),
    );
    await assertFails(
      setDoc(ref, { role: "member", inviteCode: "CODE1234", anonymous: true }),
    );
    await assertFails(
      setDoc(ref, { role: "member", inviteCode: "CODE1234", extra: 1 }),
    );
    await assertSucceeds(
      setDoc(ref, {
        role: "member",
        inviteCode: "CODE1234",
        email: "bob@example.com",
        anonymous: false,
      }),
    );
  });

  it("dezaktywowany kod nie wpuszcza", async () => {
    await assertSucceeds(deleteDoc(doc(dbAs("admin"), "invites", "CODE1234")));
    await assertFails(
      setDoc(
        doc(dbAs("kiosk", anonymous), "households", HID, "members", "kiosk"),
        {
          role: "device",
          inviteCode: "CODE1234",
        },
      ),
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

  it("konto e-mail (hasło albo link z maila) zapisuje swoje dane", async () => {
    const emailAccount = (provider: string) => ({
      firebase: { sign_in_provider: provider },
      email: "alice@example.com",
      email_verified: false,
    });
    const ref = (provider: string) =>
      doc(
        dbAs("alice", emailAccount(provider)),
        "households",
        HID,
        "members",
        "alice",
      );
    const fields = {
      email: "alice@example.com",
      anonymous: false,
      provider: "password",
    };
    await assertSucceeds(updateDoc(ref("password"), fields));
    await assertSucceeds(
      updateDoc(ref("emailLink"), { ...fields, displayName: "Ala" }),
    );
    await assertFails(updateDoc(ref("emailLink"), { provider: "google.com" }));
    await assertFails(updateDoc(ref("password"), { provider: "emailLink" }));
  });

  it("konto e-mail ma prywatne listy (nie jest „bez konta”)", async () => {
    const db = dbAs("alice", {
      firebase: { sign_in_provider: "password" },
      email: "alice@example.com",
      email_verified: false,
    });
    await assertSucceeds(
      setDoc(doc(db, "households", HID, "private", "alice", "todos", "t1"), {
        name: "Moje",
        createdBy: "alice",
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

  it("prywatne zakupy, lodówka, poradnik i pranie — tak; inne listy — nie", async () => {
    for (const name of [
      "shopping",
      "fridge",
      "guides",
      "guideEntries",
      "laundry",
    ]) {
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
          // Rachunki są zawsze wspólne
          "bills",
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

describe("rachunki i wspólne zakupy", () => {
  const bill = {
    typeId: "electricity",
    name: "Prąd",
    month: "2026-11",
    amount: 24000,
    dueOn: "2026-11-15",
    paidBy: null,
    shares: { p1: 12000, p2: 12000 },
    settled: {},
  };

  it("domownik (także tablet) wpisuje rachunek, obcy nie widzi", async () => {
    const ref = (uid: string, token?: object) =>
      doc(dbAs(uid, token), "households", HID, "bills", "2026-11_electricity");
    await assertSucceeds(
      setDoc(ref("tablet", anonymous), { ...bill, createdBy: "tablet" }),
    );
    await assertSucceeds(updateDoc(ref("alice"), { paidBy: "p1" }));
    await assertFails(getDoc(ref("bob")));
  });

  it("zablokowany zakup: inni tylko oddają i proszą o zwrot", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "households", HID, "purchases", "z1"), {
        title: "Chemia",
        items: [],
        total: 3000,
        paidBy: "p1",
        shares: { p1: 1500, p2: 1500 },
        settled: {},
        createdBy: "alice",
        locked: true,
      });
    });
    const ref = (uid: string, token?: object) =>
      doc(dbAs(uid, token), "households", HID, "purchases", "z1");
    await assertSucceeds(
      updateDoc(ref("tablet", anonymous), {
        settled: { p2: "2026-11-18T10:00:00Z" },
      }),
    );
    await assertSucceeds(
      updateDoc(ref("admin"), { refundRequestedAt: "2026-11-18T11:00:00Z" }),
    );
    await assertFails(updateDoc(ref("tablet", anonymous), { total: 1 }));
    await assertFails(deleteDoc(ref("tablet", anonymous)));
    await assertSucceeds(updateDoc(ref("alice"), { total: 3200 }));
  });
});

describe("pamięć produktów i zapasy", () => {
  it("wspólne zapasy zmienia każdy domownik", async () => {
    const ref = (uid: string, token?: object) =>
      doc(dbAs(uid, token), "households", HID, "products", "p-papier");
    await assertSucceeds(
      setDoc(ref("alice"), {
        name: "Papier",
        supply: true,
        stockAmount: 4,
        lowAt: 2,
        createdBy: "alice",
        locked: true,
      }),
    );
    await assertSucceeds(
      updateDoc(ref("tablet", anonymous), { stockAmount: 3, stock: "ok" }),
    );
    await assertFails(updateDoc(ref("tablet", anonymous), { lowAt: 0 }));
  });

  it("prywatne ceny widzi tylko właściciel", async () => {
    const path = ["households", HID, "private", "alice", "products", "p-kawa"];
    await assertSucceeds(
      setDoc(doc(dbAs("alice"), path.join("/")), {
        name: "Kawa",
        lastPrice: 3000,
        createdBy: "alice",
      }),
    );
    await assertFails(getDoc(doc(dbAs("admin"), path.join("/"))));
    await assertFails(getDoc(doc(dbAs("tablet", anonymous), path.join("/"))));
  });
});

// Adres administratora ogólnego bierzemy z reguł — bez przepisywania go tu
const SUPER_ADMIN_EMAIL = readFileSync("firestore.rules", "utf8").match(
  /token\.email == '([^']+)'/,
)![1]!;

describe("zgłoszenia błędów", () => {
  const sendReport = (
    db: ReturnType<typeof dbAs>,
    id: string,
    data: Record<string, unknown>,
  ) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "bugReports", id), data);
    batch.set(
      doc(db, "rateLimits", String(data.uid)),
      { bugReport: serverTimestamp() },
      { merge: true },
    );
    return batch.commit();
  };
  const report = (uid: string) => ({
    description: "Nie działa przycisk",
    status: "new",
    createdAt: "2026-11-18T10:00:00Z",
    uid,
    email: null,
    anonymous: true,
    householdId: HID,
    householdName: "Flat",
    role: "member",
    path: "/bills",
    search: "",
    tab: "Rachunki: month",
    selector: "main > button",
    elementText: "Zapisz",
    heading: "Rachunki",
    x: 10,
    y: 20,
    viewport: "375x812",
    scrollY: 0,
    appVersion: "dev",
    appCommit: "",
    userAgent: "test",
  });

  it("wysyła każdy (także tablet), czyta tylko administrator ogólny", async () => {
    const boss = dbAs("boss", google("boss", SUPER_ADMIN_EMAIL));
    const tablet = dbAs("tablet", anonymous);
    // Bez znacznika częstotliwości — odmowa
    await assertFails(
      setDoc(doc(tablet, "bugReports", "r0"), report("tablet")),
    );
    await assertSucceeds(sendReport(tablet, "r1", report("tablet")));
    // Drugie zgłoszenie w ciągu minuty — odmowa
    await assertFails(sendReport(tablet, "r1b", report("tablet")));
    await assertFails(
      getDoc(doc(dbAs("tablet", anonymous), "bugReports", "r1")),
    );
    await assertFails(getDoc(doc(dbAs("admin"), "bugReports", "r1")));
    await assertSucceeds(getDoc(doc(boss, "bugReports", "r1")));
    await assertSucceeds(
      updateDoc(doc(boss, "bugReports", "r1"), { status: "fixed" }),
    );
  });

  it("nie da się podszyć ani dopisać obcych pól", async () => {
    const db = dbAs("alice");
    await assertFails(setDoc(doc(db, "bugReports", "r2"), report("admin")));
    await assertFails(
      setDoc(doc(db, "bugReports", "r3"), { ...report("alice"), extra: 1 }),
    );
    await assertFails(
      setDoc(doc(db, "bugReports", "r4"), {
        ...report("alice"),
        status: "fixed",
      }),
    );
  });
});

describe("ogłoszenia i usterki", () => {
  it("ogłoszenie dodaje każdy domownik, obcy nie widzi", async () => {
    const ref = (uid: string, token?: object) =>
      doc(dbAs(uid, token), "households", HID, "announcements", "a1");
    await assertSucceeds(
      setDoc(ref("tablet", anonymous), {
        title: "Impreza",
        body: "",
        pinned: false,
        expiresOn: null,
        createdBy: "tablet",
      }),
    );
    await assertFails(getDoc(ref("bob")));
  });

  it("status usterki zmienia każdy, także na zablokowanej sprawie", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "households", HID, "todos", "u1"), {
        text: "Cieknie kran",
        done: false,
        folderId: "usterki",
        issueStatus: "new",
        createdBy: "alice",
        locked: true,
      });
    });
    const ref = doc(
      dbAs("tablet", anonymous),
      "households",
      HID,
      "todos",
      "u1",
    );
    await assertSucceeds(updateDoc(ref, { issueStatus: "reported" }));
    await assertFails(updateDoc(ref, { text: "Nic" }));
  });

  it("regulamin zapisuje tylko administrator", async () => {
    const ref = (uid: string) =>
      doc(dbAs(uid), "households", HID, "assets", "houseRules");
    await assertFails(setDoc(ref("alice"), { body: "Cisza nocna" }));
    await assertSucceeds(setDoc(ref("admin"), { body: "Cisza nocna" }));
    await assertSucceeds(getDoc(ref("alice")));
  });
});

describe("powiadomienia", () => {
  it("urządzenia zapisuje i czyta tylko właściciel konta", async () => {
    const path = "users/alice/pushSubscriptions/s1";
    await assertSucceeds(
      setDoc(doc(dbAs("alice"), path), {
        endpoint: "https://push.example/abc",
        keys: { p256dh: "x", auth: "y" },
      }),
    );
    await assertFails(getDoc(doc(dbAs("admin"), path)));
    await assertFails(
      setDoc(doc(dbAs("bob"), path), { endpoint: "https://evil.example" }),
    );
  });
});

describe("nieobecności i historia wykonań", () => {
  it("nieobecność wpisuje każdy domownik, obcy nie widzi", async () => {
    const ref = (uid: string, token?: object) =>
      doc(dbAs(uid, token), "households", HID, "absences", "a1");
    await assertSucceeds(
      setDoc(ref("alice"), {
        profileId: "p1",
        from: "2026-12-20",
        to: "2026-12-27",
        note: "",
        mode: "reassign",
        createdBy: "alice",
      }),
    );
    await assertFails(getDoc(ref("bob")));
  });

  it("historię tylko się dopisuje — zmienić nie można, usuwa admin", async () => {
    const ref = (uid: string, token?: object) =>
      doc(dbAs(uid, token), "households", HID, "completions", "c1");
    await assertSucceeds(
      setDoc(ref("tablet", anonymous), {
        itemId: "open",
        kind: "chore",
        name: "Open",
        by: "p1",
        at: "2026-11-19T10:00:00Z",
        minutes: 10,
        weight: 12,
        createdBy: "tablet",
      }),
    );
    await assertFails(updateDoc(ref("tablet", anonymous), { by: "p2" }));
    await assertFails(updateDoc(ref("admin"), { weight: 999 }));
    await assertFails(deleteDoc(ref("alice")));
    await assertFails(getDoc(ref("bob")));
    await assertSucceeds(getDoc(ref("alice")));
    await assertSucceeds(deleteDoc(ref("admin")));
  });

  it("nie dopisze historii za kogoś innego", async () => {
    await assertFails(
      setDoc(doc(dbAs("alice"), "households", HID, "completions", "c2"), {
        itemId: "open",
        by: "p1",
        at: "2026-11-19T10:00:00Z",
        createdBy: "admin",
      }),
    );
  });
});

describe("domknięcia: potwierdzenia, ogłoszenia, dziennik powiadomień", () => {
  it("płacący potwierdza zwrot na zablokowanym zakupie", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "households", HID, "purchases", "z2"), {
        title: "Chemia",
        total: 2000,
        paidBy: "p1",
        shares: { p1: 1000, p2: 1000 },
        settled: { p1: "x", p2: "y" },
        confirmed: { p1: "x" },
        createdBy: "admin",
        locked: true,
      });
    });
    const ref = doc(dbAs("alice"), "households", HID, "purchases", "z2");
    await assertSucceeds(updateDoc(ref, { confirmed: { p1: "x", p2: "z" } }));
    await assertFails(updateDoc(ref, { paidBy: "p2" }));
  });

  it("wpłatę częściową na zablokowanym rachunku wpisze domownik, kwoty nie", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), "households", HID, "bills", "2026-11_rent"),
        {
          typeId: "rent",
          name: "Czynsz",
          month: "2026-11",
          amount: 3000,
          paidBy: "p1",
          shares: { p1: 1500, p2: 1500 },
          settled: {},
          createdBy: "admin",
          locked: true,
        },
      );
    });
    const ref = doc(dbAs("alice"), "households", HID, "bills", "2026-11_rent");
    await assertSucceeds(updateDoc(ref, { payments: { p2: 500 } }));
    await assertFails(updateDoc(ref, { amount: 100 }));
  });

  it("zablokowanego ogłoszenia nie przypnie ani nie usunie ktoś inny", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), "households", HID, "announcements", "a9"),
        {
          title: "Impreza",
          body: "",
          pinned: false,
          expiresOn: null,
          createdBy: "admin",
          locked: true,
        },
      );
    });
    const ref = (uid: string) =>
      doc(dbAs(uid), "households", HID, "announcements", "a9");
    await assertFails(updateDoc(ref("alice"), { pinned: true }));
    await assertFails(deleteDoc(ref("alice")));
    await assertSucceeds(updateDoc(ref("admin"), { pinned: true }));
  });

  it("dziennika powiadomień nie czyta ani nie pisze żaden klient", async () => {
    await assertFails(getDoc(doc(dbAs("admin"), "notifyLog", "u_admin")));
    await assertFails(
      setDoc(doc(dbAs("admin"), "notifyLog", "u_admin"), { calls: 0 }),
    );
  });
});

describe("prywatne pranie", () => {
  it("program prania tylko dla mnie widzi tylko autor", async () => {
    const path = `households/${HID}/private/alice/laundry/l1`;
    await assertSucceeds(
      setDoc(doc(dbAs("alice"), path), {
        name: "Wełna",
        mode: "Delikatne",
        temperature: 30,
        rinses: 2,
        spin: 600,
        createdBy: "alice",
      }),
    );
    await assertFails(getDoc(doc(dbAs("admin"), path)));
    await assertFails(
      setDoc(doc(dbAs("tablet", anonymous), path), { name: "X" }),
    );
  });
});

describe("plany przepisów", () => {
  it("wspólny plan widzą domownicy, prywatny tylko autor", async () => {
    const plan = {
      recipeId: "r1",
      recipeName: "Gulasz",
      emoji: "🍲",
      scale: 0.7,
      plannedFor: null,
    };
    await assertSucceeds(
      setDoc(doc(dbAs("alice"), "households", HID, "recipePlans", "p1"), {
        ...plan,
        createdBy: "alice",
      }),
    );
    await assertSucceeds(
      getDoc(
        doc(dbAs("tablet", anonymous), "households", HID, "recipePlans", "p1"),
      ),
    );
    await assertFails(
      getDoc(doc(dbAs("bob"), "households", HID, "recipePlans", "p1")),
    );
    const privatePath = `households/${HID}/private/alice/recipePlans/p2`;
    await assertSucceeds(
      setDoc(doc(dbAs("alice"), privatePath), { ...plan, createdBy: "alice" }),
    );
    await assertFails(getDoc(doc(dbAs("admin"), privatePath)));
  });
});

describe("role: gość i urządzenie", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "households", HID, "members", "guest"), {
        role: "guest",
      });
      await setDoc(doc(db, "households", HID, "members", "kiosk"), {
        role: "device",
      });
      await setDoc(doc(db, "households", HID, "bills", "b1"), {
        name: "Prąd",
        amount: 100,
        createdBy: "admin",
      });
      await setDoc(doc(db, "households", HID, "shopping", "s1"), {
        name: "Mleko",
        checked: false,
        createdBy: "alice",
      });
    });
  });

  const at = (uid: string, path: string, token?: object) =>
    doc(dbAs(uid, token), `households/${HID}/${path}`);

  it("gość tylko ogląda zakupy, nie widzi rachunków i nic nie zapisuje", async () => {
    await assertSucceeds(getDoc(at("guest", "shopping/s1")));
    await assertFails(getDoc(at("guest", "bills/b1")));
    await assertFails(getDoc(at("guest", "chores/open")));
    await assertFails(updateDoc(at("guest", "shopping/s1"), { checked: true }));
    await assertFails(
      setDoc(at("guest", "shopping/s2"), { name: "X", createdBy: "guest" }),
    );
    await assertFails(
      updateDoc(doc(dbAs("guest"), "households", HID), { panic: null }),
    );
  });

  it("urządzenie odhacza i używa kuchni, ale nie edytuje reszty", async () => {
    const kiosk = (path: string) => at("kiosk", path, anonymous);
    await assertSucceeds(
      updateDoc(kiosk("chores/open"), { lastCompleted: "x" }),
    );
    await assertFails(updateDoc(kiosk("chores/open"), { name: "Nowa nazwa" }));
    await assertSucceeds(updateDoc(kiosk("shopping/s1"), { name: "Mleko 2%" }));
    await assertSucceeds(
      setDoc(kiosk("fridge/f1"), { name: "Ser", createdBy: "kiosk" }),
    );
    await assertSucceeds(deleteDoc(kiosk("shopping/s1")));
    await assertSucceeds(getDoc(kiosk("bills/b1")));
    await assertFails(updateDoc(kiosk("bills/b1"), { amount: 1 }));
    await assertFails(
      setDoc(kiosk("todos/t1"), { text: "X", createdBy: "kiosk" }),
    );
  });

  it("rolę zmienia twórca — tylko na znaną", async () => {
    const ref = (uid: string) =>
      doc(dbAs(uid), "households", HID, "members", "alice");
    await assertSucceeds(updateDoc(ref("admin"), { role: "guest" }));
    await assertFails(updateDoc(ref("admin"), { role: "boss" }));
  });
});

describe("widoczność statystyk", () => {
  const entry = (by: string) => ({
    itemId: "open",
    kind: "chore",
    name: "Open",
    by,
    at: "2026-11-19T10:00:00Z",
    minutes: 10,
    weight: 12,
    createdBy: "admin",
  });

  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await updateDoc(doc(db, "households", HID, "members", "alice"), {
        profileId: "p1",
      });
      await setDoc(doc(db, "households", HID, "members", "kiosk"), {
        role: "device",
      });
      await setDoc(
        doc(db, "households", HID, "completions", "mine"),
        entry("p1"),
      );
      await setDoc(
        doc(db, "households", HID, "completions", "theirs"),
        entry("p2"),
      );
    });
  });

  const setMode = (statsVisibility: string) =>
    env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), "households", HID), { statsVisibility }),
    );
  const read = (uid: string, id: string, token?: object) =>
    getDoc(doc(dbAs(uid, token), "households", HID, "completions", id));

  it("domyślnie (all) widzą domownicy, urządzenie nie", async () => {
    await assertSucceeds(read("alice", "theirs"));
    await assertFails(read("kiosk", "mine", anonymous));
  });

  it("own — tylko własne wpisy, zapytaniem po profilu", async () => {
    await setMode("own");
    await assertSucceeds(read("alice", "mine"));
    await assertFails(read("alice", "theirs"));
    const col = collection(dbAs("alice"), "households", HID, "completions");
    await assertSucceeds(getDocs(query(col, where("by", "==", "p1"))));
    await assertFails(getDocs(col));
    await assertSucceeds(read("admin", "theirs"));
  });

  it("admins — tylko administrator", async () => {
    await setMode("admins");
    await assertFails(read("alice", "mine"));
    await assertSucceeds(read("admin", "theirs"));
  });
});
