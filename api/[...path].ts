let appPromise: Promise<any> | undefined;

function loadApp() {
  appPromise ??= import("../artifacts/api-server/src/app.js").then((module) => module.default);
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await loadApp();
  return app(req, res);
}
