import { Client } from "ldapts";
import env from "@/env";
import { decryptIfNeeded } from "@/lib/crypto";

export interface LdapUserEntry {
  dn: string;
  uid: string;
  cn: string;
  mail: string;
  title: string;
  displayName: string;
}

export function createClient(): Client {
  return new Client({
    url: env.LDAP_URL,
    timeout: 10000, // Set a timeout of 10000ms (10 seconds)
    connectTimeout: 10000, // Set a connection timeout of 10000ms (10 seconds)
  });
}

export async function bindClient(client: Client): Promise<void> {
  const bindDN = env.LDAP_BIND_DN;
  const bindPasswordRaw = env.LDAP_BIND_PASSWORD;

  if (!bindDN || !bindPasswordRaw) {
    throw new Error("LDAP bind DN or password is not set");
  }

  const bindPassword = decryptIfNeeded(bindPasswordRaw);
  await client.bind(bindDN, bindPassword);
}

function getFirst(val: unknown): string {
  if (Array.isArray(val)) return String(val[0] ?? "");
  return String(val ?? "");
}

export async function searchLdapUser(query: string): Promise<LdapUserEntry[]> {
  const client = createClient();
  try {
    await bindClient(client);
    const escaped = query.replace(/[*()\\]/g, "\\$&");
    const filter = `(&(objectClass=user)(|(sAMAccountName=*${escaped}*)(displayName=*${escaped}*)))`;

    const { searchEntries } = await client.search(env.LDAP_SEARCH_BASE, {
      filter,
      scope: "sub",
      sizeLimit: 20,
      timeLimit: 5,
      attributes: ["dn", env.LDAP_USERNAME_ATTRIBUTE, "cn", "mail", "title", "displayName"],
    });

    return searchEntries.map((entry) => {
      const attrs = entry as unknown as Record<string, unknown>;
      return {
        dn: String(entry.dn ?? ""),
        uid: getFirst(attrs[env.LDAP_USERNAME_ATTRIBUTE]),
        cn: getFirst(attrs["cn"]),
        mail: getFirst(attrs["mail"]),
        title: getFirst(attrs["title"]),
        displayName: getFirst(attrs["displayName"]),
      };
    });
  } catch (error) {
    throw new Error(`Error searching LDAP user: ${error}`);
  } finally {
    client.unbind().catch((error) => {
      console.error("Error unbinding LDAP client:", error);
    });
  }
}

/**
 * Build UPN (user@domain) from username and authenticate against LDAP.
 */
export function buildUPN(username: string): string {
  return `${username}@${env.LDAP_DOMAIN}`;
}

/**
 * Authenticate a user against LDAP via UPN bind.
 */
export async function authenticateWithUPN(upn: string, password: string): Promise<boolean> {
  const client = createClient();
  try {
    await client.bind(upn, password);
    return true;
  } catch {
    return false;
  } finally {
    await client.unbind();
  }
}
