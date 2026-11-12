import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// public/.well-known/assetlinks.json liga o site ao app Android (TWA). Se o arquivo quebrar ou perder a
// impressão digital da chave que assinou o APK, o app passa a abrir com barra de navegador em vez de
// tela cheia. Este teste protege contra erro de digitação nesse arquivo.
const PACKAGE = "app.gideonsfit.twa";
const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

type Statement = {
  relation: string[];
  target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
};

const statements = JSON.parse(
  readFileSync(join(process.cwd(), "public/.well-known/assetlinks.json"), "utf8")
) as Statement[];

describe("assetlinks.json", () => {
  it("tem uma declaração para o app Android com a permissão de abrir os links do site", () => {
    expect(statements).toHaveLength(1);
    const [statement] = statements;
    expect(statement.relation).toEqual(["delegate_permission/common.handle_all_urls"]);
    expect(statement.target.namespace).toBe("android_app");
    expect(statement.target.package_name).toBe(PACKAGE);
  });

  it("só tem impressões digitais SHA-256 válidas (32 pares hexadecimais em maiúsculas), sem repetir", () => {
    const fingerprints = statements[0].target.sha256_cert_fingerprints;
    expect(fingerprints.length).toBeGreaterThanOrEqual(1);
    for (const fingerprint of fingerprints) expect(fingerprint).toMatch(FINGERPRINT);
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
  });

  it("mantém a impressão digital do keystore antigo (o app antigo continua válido) e a do novo", () => {
    const fingerprints = statements[0].target.sha256_cert_fingerprints;
    expect(fingerprints).toContain("CF:D7:69:F4:5B:34:B9:F4:EF:45:4A:3E:3D:1D:00:7E:30:99:8A:AA:03:0F:38:C6:27:CC:5A:58:48:E9:F2:B2");
    expect(fingerprints).toContain("95:8E:FA:F0:50:52:0A:36:E5:21:F6:EB:6C:4C:4A:20:5A:06:6D:93:10:D3:1B:CA:8E:D3:AF:F2:B7:D3:87:C1");
  });
});
