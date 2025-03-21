import glassLoader from '@/assets/glass-loader.gif'
const HourglassAnimation = ({ size = 120 }: { size?: number }) => {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Replace this with your gif file */}
      <img
        src={glassLoader}
        alt="Hourglass Animation"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default HourglassAnimation;