import { describe, expect, it } from "vitest";
import { ADMIN_SESSION_MAX_AGE_S, asAdminCookie } from "./cookie-options";

describe("asAdminCookie", () => {
  it("caps the library's 400-day cookie at the admin lifetime", () => {
    expect(asAdminCookie({ path: "/", maxAge: 400 * 24 * 3600, sameSite: "lax" })).toEqual({
      path: "/", maxAge: ADMIN_SESSION_MAX_AGE_S, sameSite: "lax",
    });
    expect(ADMIN_SESSION_MAX_AGE_S).toBe(30 * 24 * 3600);
  });

  it("replaces an Expires date with the same lifetime", () => {
    const out = asAdminCookie({ expires: new Date("2099-01-01") });
    expect(out.expires).toBeUndefined();
    expect(out.maxAge).toBe(ADMIN_SESSION_MAX_AGE_S);
  });

  it("leaves a sign-out (maxAge 0) alone so the cookie is deleted", () => {
    const del = { path: "/", maxAge: 0 };
    expect(asAdminCookie(del)).toBe(del);
  });

  it("handles missing options", () => {
    expect(asAdminCookie()).toEqual({ maxAge: ADMIN_SESSION_MAX_AGE_S });
  });
});
