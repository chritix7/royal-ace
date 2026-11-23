/**
 * Passkeys (WebAuthn) verified with node:crypto only: a tiny CBOR reader,
 * COSE → JWK, and the checks the spec asks for (type, challenge, origin,
 * RP ID hash, user present + verified, signature). Attestation is not
 * requested ("none"), so it is not verified.
 */
import { createHash, createPublicKey, randomBytes, verify, type JsonWebKey } from "node:crypto";

export const b64u = (b: Uint8Array | Buffer) => Buffer.from(b).toString("base64url");
export const fromB64u = (s: string) => Buffer.from(s, "base64url");
export const randomId = (n = 24) => b64u(randomBytes(n));
const sha256 = (b: Buffer | string) => createHash("sha256").update(b).digest();

// ── CBOR (enough for attestation objects and COSE keys) ──
function readCbor(buf: Buffer, pos = 0): [unknown, number] {
  const ib = buf[pos++];
  const major = ib >> 5;
  const info = ib & 31;
  let len: number;
  if (info < 24) len = info;
  else if (info === 24) len = buf[pos++];
  else if (info === 25) { len = buf.readUInt16BE(pos); pos += 2; }
  else if (info === 26) { len = buf.readUInt32BE(pos); pos += 4; }
  else if (info === 27) { len = Number(buf.readBigUInt64BE(pos)); pos += 8; }
  else throw new Error("cbor-indefinite");
  switch (major) {
    case 0: return [len, pos];
    case 1: return [-1 - len, pos];
    case 2: return [buf.subarray(pos, pos + len), pos + len];
    case 3: return [buf.subarray(pos, pos + len).toString("utf8"), pos + len];
    case 4: {
      const arr: unknown[] = [];
      for (let i = 0; i < len; i++) { const [v, p] = readCbor(buf, pos); arr.push(v); pos = p; }
      return [arr, pos];
    }
    case 5: {
      const map = new Map<unknown, unknown>();
      for (let i = 0; i < len; i++) {
        const [k, p1] = readCbor(buf, pos);
        const [v, p2] = readCbor(buf, p1);
        map.set(k, v); pos = p2;
      }
      return [map, pos];
    }
    case 7: return [info === 20 ? false : info === 21 ? true : null, pos];
    default: throw new Error("cbor-type");
  }
}

export type StoredKey = { id: string; jwk: JsonWebKey; alg: number; counter: number };

function coseToJwk(cose: Map<unknown, unknown>): { jwk: JsonWebKey; alg: number } {
  const kty = cose.get(1), alg = cose.get(3) as number;
  if (kty === 2 && alg === -7 && cose.get(-1) === 1) {
    return { alg, jwk: { kty: "EC", crv: "P-256", x: b64u(cose.get(-2) as Buffer), y: b64u(cose.get(-3) as Buffer) } };
  }
  if (kty === 3 && alg === -257) {
    return { alg, jwk: { kty: "RSA", n: b64u(cose.get(-1) as Buffer), e: b64u(cose.get(-2) as Buffer) } };
  }
  throw new Error("unsupported-key");
}

function parseAuthData(ad: Buffer) {
  if (ad.length < 37) throw new Error("bad-authdata");
  const rpIdHash = ad.subarray(0, 32);
  const flags = ad[32];
  const counter = ad.readUInt32BE(33);
  let cred: { id: Buffer; cose: Map<unknown, unknown> } | null = null;
  if (flags & 0x40) {
    const idLen = ad.readUInt16BE(53);
    const id = ad.subarray(55, 55 + idLen);
    const [cose] = readCbor(ad, 55 + idLen);
    cred = { id, cose: cose as Map<unknown, unknown> };
  }
  return { rpIdHash, flags, counter, cred };
}

function checkClient(clientDataB64: string, type: string, challenge: string, origin: string) {
  const raw = fromB64u(clientDataB64);
  const c = JSON.parse(raw.toString("utf8")) as { type: string; challenge: string; origin: string };
  if (c.type !== type) throw new Error("bad-type");
  if (c.challenge !== challenge) throw new Error("bad-challenge");
  if (c.origin !== origin) throw new Error("bad-origin");
  return raw;
}
function checkAuth(a: ReturnType<typeof parseAuthData>, rpId: string) {
  if (!a.rpIdHash.equals(sha256(rpId))) throw new Error("bad-rp");
  if (!(a.flags & 0x01)) throw new Error("not-present");
  if (!(a.flags & 0x04)) throw new Error("not-verified");
}

export function verifyRegistration(p: { clientDataJSON: string; attestationObject: string }, challenge: string, origin: string, rpId: string): StoredKey {
  checkClient(p.clientDataJSON, "webauthn.create", challenge, origin);
  const [att] = readCbor(fromB64u(p.attestationObject));
  const authData = (att as Map<string, unknown>).get("authData") as Buffer;
  const a = parseAuthData(authData);
  checkAuth(a, rpId);
  if (!a.cred) throw new Error("no-credential");
  const { jwk, alg } = coseToJwk(a.cred.cose);
  createPublicKey({ key: jwk, format: "jwk" }); // throws if malformed
  return { id: b64u(a.cred.id), jwk, alg, counter: a.counter };
}

export function verifyAssertion(
  p: { clientDataJSON: string; authenticatorData: string; signature: string },
  key: StoredKey,
  challenge: string,
  origin: string,
  rpId: string,
): number {
  const client = checkClient(p.clientDataJSON, "webauthn.get", challenge, origin);
  const ad = fromB64u(p.authenticatorData);
  const a = parseAuthData(ad);
  checkAuth(a, rpId);
  const data = Buffer.concat([ad, sha256(client)]);
  const pub = createPublicKey({ key: key.jwk, format: "jwk" });
  const sig = fromB64u(p.signature);
  const ok = key.alg === -7 ? verify("sha256", data, { key: pub, dsaEncoding: "der" }, sig) : verify("sha256", data, pub, sig);
  if (!ok) throw new Error("bad-signature");
  // Synced passkeys (iCloud) always report 0; otherwise the counter must grow.
  if (a.counter !== 0 && key.counter !== 0 && a.counter <= key.counter) throw new Error("counter");
  return a.counter;
}
