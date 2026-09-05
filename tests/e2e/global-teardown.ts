import { stopWorkerFromPidFile } from "./global-setup";

export default async function globalTeardown() {
  await stopWorkerFromPidFile();
}
