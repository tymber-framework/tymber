import { type HttpContext, INJECT, Middleware } from "@tymber/common";
import { MiscRepository } from "../repositories/MiscRepository.js";

function computeTextColor(backgroundColor: string) {
  if (backgroundColor.startsWith("#")) {
    backgroundColor = backgroundColor.substring(1); // Remove the "#".
  }

  const r = parseInt(backgroundColor.substring(0, 2), 16);
  const g = parseInt(backgroundColor.substring(2, 4), 16);
  const b = parseInt(backgroundColor.substring(4, 6), 16);

  const luminance =
    0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);

  return luminance > 0.5 ? "#222" : "#DDD";
}

export class CheckInit extends Middleware {
  static [INJECT] = [MiscRepository];

  private cachedApp?: {
    name: string;
    environment: {
      name: string;
      color: string;
      textColor: string;
    };
  };

  constructor(private readonly miscRepository: MiscRepository) {
    super();
  }

  override async handle(ctx: HttpContext) {
    if (!this.cachedApp) {
      const appObject = await this.miscRepository.findById(ctx, "app");
      this.cachedApp = appObject?.value;
      if (
        this.cachedApp &&
        this.cachedApp.environment &&
        this.cachedApp.environment.color
      ) {
        this.cachedApp.environment.textColor = computeTextColor(
          this.cachedApp.environment.color,
        );
      }
    }

    // @ts-expect-error TODO proper typing
    ctx.app = this.cachedApp;

    if (
      this.cachedApp ||
      ["/admin/init", "/api/admin/init"].includes(ctx.path)
    ) {
      return;
    }

    const acceptHeader = ctx.headers.get("accept");

    if (acceptHeader?.includes("text/html")) {
      return ctx.redirect("/admin/init");
    } else {
      return Response.json(
        {
          message: "app is not initialized yet",
        },
        {
          status: 400,
        },
      );
    }
  }
}
