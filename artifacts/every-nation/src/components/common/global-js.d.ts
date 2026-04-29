declare module "../../../attached_assets/home_btn.js" {
  import * as React from "react";
  export const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
}

declare module "../../../../../attached_assets/home_btn.js" {
  import * as React from "react";
  export const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
}

declare module "*.js" {
  import * as React from "react";
  export const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
}
