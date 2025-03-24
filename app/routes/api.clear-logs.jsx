import { writeFile } from "fs/promises";
import { join } from "path";
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
    
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const nombre = url.searchParams.get("nombre");
  if (!nombre) {
    return json({ error: "Missing log name" }, { status: 400 });
  }

  const logFilePath = join(process.cwd(), "logs", `logs-${nombre}.txt`);

  try {
    await writeFile(logFilePath, "");
    return json({ message: "Logs cleared successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error clearing log file:", error);
    return json({ error: "Failed to clear logs" }, { status: 500 });
  }
};