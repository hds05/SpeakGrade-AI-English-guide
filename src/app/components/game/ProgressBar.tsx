type Props = {
  currentRound: number;
  totalRounds: number;
};

export default function ProgressBar({ currentRound, totalRounds }: Props) {
  const percent = (currentRound / totalRounds) * 100;

  return (
    <div className="w-full h-6 bg-gray-800 rounded-full shadow-inner relative overflow-hidden border border-gray-600">
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${percent}%`,
          background: `linear-gradient(135deg, #00ff95, #00c4ff)`,
          boxShadow: 'inset 0 -2px 6px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)',
          borderRadius: '9999px',
        }}
      />
      {/* Add a glossy top layer for 3D feel */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full pointer-events-none" />
    </div>
  );
}
