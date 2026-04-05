declare module 'serverless-http' {
  import type { Application } from 'express';

  export default function serverless(
    app: Application,
    options?: { binary?: string[] }
  ): (req: unknown, res: unknown) => Promise<unknown>;
}
