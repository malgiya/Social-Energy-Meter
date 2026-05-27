import { useListPeopleEnergy } from "@workspace/api-client-react";
import { PageTransition, staggerContainer, staggerItem } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceLine } from "recharts";
import { formatDistanceToNow, parseISO } from "date-fns";

export default function EnergyMap() {
  const { data: people, isLoading } = useListPeopleEnergy();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.avgEnergyDelta > 0;
      return (
        <div className="glass p-4 rounded-xl border-white/10 text-sm">
          <p className="font-serif text-xl text-foreground mb-1">{data.personName}</p>
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Avg Impact: <span className={`font-medium ${isPositive ? 'text-energizing' : data.avgEnergyDelta < 0 ? 'text-draining' : 'text-foreground'}`}>
                {isPositive ? '+' : ''}{data.avgEnergyDelta.toFixed(1)}
              </span>
            </p>
            <p className="text-muted-foreground">Interactions: <span className="text-foreground">{data.totalInteractions}</span></p>
            {data.lastInteractionAt && (
              <p className="text-muted-foreground text-xs mt-2 pt-2 border-t border-white/10">
                Last seen {formatDistanceToNow(parseISO(data.lastInteractionAt))} ago
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <PageTransition className="h-full flex flex-col">
      <div className="space-y-2 mb-8">
        <h1 className="font-serif text-4xl md:text-5xl text-foreground">The Energy Map.</h1>
        <p className="text-muted-foreground text-lg">Visualizing who replenishes you and who drains you.</p>
      </div>

      <div className="flex-1 glass rounded-3xl p-6 min-h-[500px] relative overflow-hidden flex flex-col">
        {/* Subtle background guides */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-energizing/5 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-draining/5 to-transparent" />
        </div>

        <div className="flex-1 w-full relative z-10">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : people && people.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="totalInteractions" 
                  name="Interactions" 
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Frequency of Contact', position: 'bottom', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="avgEnergyDelta" 
                  name="Energy Impact" 
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  domain={[-10, 10]}
                />
                <ZAxis type="number" range={[200, 600]} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--border))' }} />
                
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                
                <Scatter data={people} animationDuration={1500}>
                  {people.map((entry, index) => {
                    const isPositive = entry.avgEnergyDelta > 0;
                    const isNeutral = entry.avgEnergyDelta === 0;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isPositive ? 'hsl(var(--energizing))' : isNeutral ? 'hsl(var(--muted))' : 'hsl(var(--draining))'} 
                        fillOpacity={0.6}
                        stroke={isPositive ? 'hsl(var(--energizing))' : isNeutral ? 'hsl(var(--muted))' : 'hsl(var(--draining))'}
                        strokeWidth={2}
                        className={isPositive ? 'glow-primary drop-shadow-[0_0_8px_rgba(var(--energizing),0.5)]' : ''}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Log interactions to see your social constellation map.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}