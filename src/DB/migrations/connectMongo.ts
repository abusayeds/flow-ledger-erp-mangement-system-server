import dns from "dns";
import mongoose from "mongoose";

/** Git Bash / Windows: system DNS often blocks Atlas SRV lookups. */
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const parseSrvUrl = (srvUrl: string) => {
  const match = srvUrl.match(/^mongodb\+srv:\/\/([^/]+)@([^/]+)\/([^?]*)(.*)?$/);
  if (!match) return null;
  const [, credentials, host, database, queryPart] = match;
  return {
    credentials,
    host,
    database,
    queryPart: queryPart?.startsWith("?") ? queryPart.slice(1) : queryPart ?? "",
  };
};

/** Resolve mongodb+srv to mongodb:// using public DNS (bypasses local SRV failures). */
export const resolveMongoSrvUrl = async (srvUrl: string): Promise<string> => {
  const parsed = parseSrvUrl(srvUrl);
  if (!parsed) return srvUrl;

  const records = await dns.promises.resolveSrv(`_mongodb._tcp.${parsed.host}`);
  if (!records.length) {
    throw new Error(`No SRV records found for _mongodb._tcp.${parsed.host}`);
  }

  const hosts = records.map((record) => `${record.name}:${record.port}`).join(",");
  const params = new URLSearchParams(parsed.queryPart);
  if (!params.has("ssl") && !params.has("tls")) params.set("ssl", "true");
  if (!params.has("authSource")) params.set("authSource", "admin");
  const query = params.toString();

  return `mongodb://${parsed.credentials}@${hosts}/${parsed.database}${query ? `?${query}` : ""}`;
};

export const connectMigrationMongo = async () => {
  const directUrl = process.env.DATABASE_URL_STANDARD?.trim();
  const srvUrl = process.env.DATABASE_URL?.trim();

  if (!directUrl && !srvUrl) {
    throw new Error("DATABASE_URL is not set in .env");
  }

  if (directUrl) {
    await mongoose.connect(directUrl, { serverSelectionTimeoutMS: 20000 });
    console.log("Connected using DATABASE_URL_STANDARD");
    return;
  }

  try {
    await mongoose.connect(srvUrl!, { serverSelectionTimeoutMS: 20000 });
    console.log("Connected using DATABASE_URL (srv)");
    return;
  } catch (srvError) {
    if (!String(srvError).includes("querySrv") && !String(srvError).includes("ECONNREFUSED")) {
      throw srvError;
    }
    console.warn("SRV connect failed — resolving via Google DNS and retrying with standard URI...");
    const standardUrl = await resolveMongoSrvUrl(srvUrl!);
    await mongoose.connect(standardUrl, { serverSelectionTimeoutMS: 20000 });
    console.log("Connected using resolved standard MongoDB URI");
  }
};
