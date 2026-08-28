const fs = require('fs');
const file = 'src/components/MotionWrappers.tsx';
let content = fs.readFileSync(file, 'utf8');

const newParallax = `export function ParallaxBackground({ containerRef }: ParallaxBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll({ container: containerRef });
  
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y3 = useTransform(scrollY, [0, 1000], [0, 150]);
  const y4 = useTransform(scrollY, [0, 1000], [0, -100]);

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20">
      <motion.div
        style={{ y: y1, willChange: 'transform' }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-app-accent1/20 blur-[120px] opacity-60 mix-blend-screen dark:mix-blend-lighten"
      />
      <motion.div
        style={{ y: y2, willChange: 'transform' }}
        className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-app-accent2/20 blur-[140px] opacity-50 mix-blend-screen dark:mix-blend-lighten"
      />
      <motion.div
        style={{ y: y3, willChange: 'transform' }}
        className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-app-accent3/15 blur-[160px] opacity-40 mix-blend-screen dark:mix-blend-lighten"
      />
      <motion.div
        style={{ y: y4, willChange: 'transform' }}
        className="absolute top-[20%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-app-accent1/15 blur-[100px] opacity-30 mix-blend-screen dark:mix-blend-lighten"
      />
    </div>
  );
}`;

content = content.replace(/export function ParallaxBackground[\s\S]*?\}\s*\n/m, newParallax + "\n");
fs.writeFileSync(file, content);
