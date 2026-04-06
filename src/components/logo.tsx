export function Logo({ className = "h-16", variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  const textColor = variant === "light" ? "#F5F0E8" : "#2D3028";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 90" fill="none" className={className}>
      <g transform="translate(45, 65)">
        {[[-38,-55],[-33,-57],[-28,-59],[-23,-60],[-18,-61],[-13,-62],[-8,-63],[-3,-63],[3,-63],[8,-63],[13,-62],[18,-61],[23,-60],[28,-59],[33,-57],[38,-55]].map(([x,y], i) => (
          <line key={i} x1="0" y1="0" x2={x} y2={y} stroke="#C9A84C" strokeWidth="1.2" />
        ))}
        <line x1="-42" y1="0" x2="42" y2="0" stroke="#C9A84C" strokeWidth="1.2" />
      </g>
      <text x="105" y="38" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "28px", fontWeight: 400, letterSpacing: "5px" }} fill={textColor}>SUN STREET</text>
      <text x="105" y="62" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "15px", fontWeight: 300, letterSpacing: "9px" }} fill={textColor}>PROPERTIES</text>
    </svg>
  );
}
