import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width={500}
    height={500}
    viewBox="0 0 375 375"
    {...props}
  >
    {/* ...existing SVG content... */}
  </svg>
);
export { SVGComponent };
export default SVGComponent;
