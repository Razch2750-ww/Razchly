#!/bin/bash
cat << 'INNER_EOF' > tmp_loading
const LoadingFallback = () => (
  <div className="flex flex-col w-full h-full p-4 md:p-8 animate-pulse">
    <div className="w-full flex items-center justify-between mb-8">
      <div className="w-32 h-8 bg-app-card rounded-lg" />
      <div className="w-10 h-10 bg-app-card rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="col-span-1 h-32 bg-app-card rounded-[18px]" />
      <div className="col-span-1 h-32 bg-app-card rounded-[18px]" />
      <div className="col-span-1 h-32 bg-app-card rounded-[18px]" />
    </div>
    <div className="w-full h-64 bg-app-card rounded-[18px]" />
  </div>
);
INNER_EOF

# Replace the LoadingFallback block in App.tsx
sed -i -e '/const LoadingFallback = () => (/,/);/c\
'"$(cat tmp_loading | sed 's/$/\\/g')"'' src/App.tsx
# Need to fix the last line since sed adds \ at the end
sed -i 's/\\$//' src/App.tsx
