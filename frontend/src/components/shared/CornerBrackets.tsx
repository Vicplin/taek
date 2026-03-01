export default function CornerBrackets({ className = "" }: { className?: string }) {
  return (
    <>
      {/* Top Left */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red ${className}`} />
      
      {/* Top Right */}
      <div className={`absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red ${className}`} />
      
      {/* Bottom Left */}
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red ${className}`} />
      
      {/* Bottom Right */}
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red ${className}`} />
    </>
  );
}
