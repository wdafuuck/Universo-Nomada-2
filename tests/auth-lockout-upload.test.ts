import { describe, expect, it, beforeEach } from "vitest";
import {
  checkLoginLockout,
  clearLoginLockout,
  recordLoginFailure,
  resetAuthLockoutState,
} from "@/lib/auth-lockout";
import { detectBufferMime, validateUploadBuffer } from "@/lib/upload-mime";

describe("auth-lockout", () => {
  beforeEach(() => {
    resetAuthLockoutState();
  });

  it("bloquea tras 5 intentos fallidos por email", () => {
    const email = "admin@test.cl";
    const ip = "1.2.3.4";

    for (let i = 0; i < 4; i++) {
      const r = recordLoginFailure(email, ip);
      expect(r.locked).toBe(false);
    }

    const last = recordLoginFailure(email, ip);
    expect(last.locked).toBe(true);
    expect(last.retryAfterSec).toBeGreaterThan(0);

    const lock = checkLoginLockout(email, ip);
    expect(lock.locked).toBe(true);
  });

  it("limpia lockout tras login exitoso", () => {
    const email = "ok@test.cl";
    const ip = "5.6.7.8";

    for (let i = 0; i < 5; i++) recordLoginFailure(email, ip);
    expect(checkLoginLockout(email, ip).locked).toBe(true);

    clearLoginLockout(email, ip);
    expect(checkLoginLockout(email, ip).locked).toBe(false);
  });
});

describe("upload-mime", () => {
  it("detecta JPEG por magic bytes", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectBufferMime(buf)).toBe("image/jpeg");
  });

  it("detecta PDF por magic bytes", () => {
    const buf = Buffer.from("%PDF-1.4\n");
    expect(detectBufferMime(buf)).toBe("application/pdf");
  });

  it("rechaza PHP disfrazado de imagen", () => {
    const buf = Buffer.from("<?php echo 'x'; ?>");
    const result = validateUploadBuffer(buf, "image/jpeg");
    expect(result.ok).toBe(false);
  });

  it("rechaza imagen declarada como PDF", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const result = validateUploadBuffer(buf, "application/pdf");
    expect(result.ok).toBe(false);
  });
});
