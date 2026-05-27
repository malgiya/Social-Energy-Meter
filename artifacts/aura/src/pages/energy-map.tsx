import { useListPeopleEnergy, useGetSocialCircleAnalysis, getGetSocialCircleAnalysisQueryKey } from "@workspace/api-client-react";
import { PageTransition, staggerContainer, staggerItem } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceLine } from "recharts";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck, Heart, User, Sparkles, Activity, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EnergyMap() {
  const { data: people, isLoading: isPeopleLoading } = useListPeopleEnergy();
  const { data: analysis, isLoading: isAnalysisLoading, isFetching: isAnalysisFetching } = useGetSocialCircleAnalysis();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefreshAnalysis = async () => {
    await queryClient.refetchQueries({ queryKey: getGetSocialCircleAnalysisQueryKey() });
    toast({ title: "Analysis Refreshed", description: "Your social circle analysis is up to date." });
  };

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
    <PageTransition className="h-full flex flex-col space-y-12 pb-12">
      <div>
        <div className="space-y-2 mb-8">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">The Energy Map.</h1>
          <p className="text-muted-foreground text-lg">Visualizing who replenishes you and who drains you.</p>
        </div>

        <div className="glass rounded-3xl p-6 min-h-[500px] relative overflow-hidden flex flex-col">
          {/* Subtle background guides */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-energizing/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-draining/5 to-transparent" />
          </div>

          <div className="flex-1 w-full relative z-10 min-h-[450px]">
            {isPeopleLoading ? (
              <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : people && people.length > 0 ? (
              <ResponsiveContainer width="100%" height={450}>
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
              <div className="w-full h-full min-h-[400px] flex items-center justify-center text-muted-foreground">
                Log interactions to see your social constellation map.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground flex items-center gap-3">
              <Compass className="w-8 h-8 text-blue-400" />
              Circle Analysis.
            </h2>
            <p className="text-muted-foreground text-lg">Deep insights into your social ecosystem.</p>
          </div>
          <Button 
            onClick={handleRefreshAnalysis}
            disabled={isAnalysisFetching}
            className="bg-white/5 hover:bg-white/10 text-foreground border border-white/10 backdrop-blur-md transition-all duration-300 rounded-xl"
            data-testid="button-analyze-circle"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalysisFetching ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
            Analyze My Circle
          </Button>
        </div>

        {isAnalysisLoading ? (
          <div className="space-y-6">
            <div className="h-32 glass rounded-3xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 glass rounded-3xl animate-pulse" />
              <div className="h-64 glass rounded-3xl animate-pulse" />
            </div>
          </div>
        ) : analysis ? (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Health Score & Summary */}
            <motion.div variants={staggerItem} className="glass rounded-3xl p-8 border-blue-400/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="text-center md:text-left">
                  <p className="text-sm font-bold tracking-wider uppercase text-blue-400 mb-2">Overall Health</p>
                  <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <span className="font-serif text-7xl text-foreground">{analysis.overallHealthScore}</span>
                    <span className="text-xl text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="flex-1 md:border-l md:border-white/10 md:pl-8">
                  <p className="text-lg text-foreground/90 leading-relaxed font-serif">
                    {analysis.summary}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Interaction Balance */}
              <motion.div variants={staggerItem} className="glass rounded-3xl p-6 flex flex-col">
                <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" />
                  Interaction Balance
                </h3>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex h-12 rounded-full overflow-hidden mb-6 shadow-inner bg-black/20">
                    <div 
                      className="bg-energizing transition-all duration-1000" 
                      style={{ width: `${Math.max(analysis.interactionBalance.energizingPercent, 5)}%` }} 
                      title={`Energizing: ${analysis.interactionBalance.energizingPercent.toFixed(1)}%`}
                    />
                    <div 
                      className="bg-muted transition-all duration-1000" 
                      style={{ width: `${Math.max(100 - analysis.interactionBalance.energizingPercent - analysis.interactionBalance.drainingPercent, 5)}%` }}
                      title={`Neutral`}
                    />
                    <div 
                      className="bg-draining transition-all duration-1000" 
                      style={{ width: `${Math.max(analysis.interactionBalance.drainingPercent, 5)}%` }}
                      title={`Draining: ${analysis.interactionBalance.drainingPercent.toFixed(1)}%`}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-serif text-energizing">{analysis.interactionBalance.energizingCount}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Energizing</p>
                    </div>
                    <div>
                      <p className="text-3xl font-serif text-muted-foreground">{analysis.interactionBalance.neutralCount}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Neutral</p>
                    </div>
                    <div>
                      <p className="text-3xl font-serif text-draining">{analysis.interactionBalance.drainingCount}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Draining</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Safe People */}
              <motion.div variants={staggerItem} className="glass rounded-3xl p-6 border-amber-500/10">
                <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  Safe People
                </h3>
                {analysis.safePeople.length > 0 ? (
                  <div className="space-y-4">
                    {analysis.safePeople.map((person, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Heart className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-serif text-lg">{person.personName}</h4>
                            <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              Score: {person.safetyScore}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {person.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
                    <p>No safe people identified yet.</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Full Circle */}
            <motion.div variants={staggerItem} className="glass rounded-3xl p-6">
              <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                Full Circle
              </h3>
              {analysis.connections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.connections.map((conn, i) => {
                    const isEnergizing = conn.classification === "energizing";
                    const isDraining = conn.classification === "draining";
                    const colorClass = isEnergizing ? "text-energizing border-energizing/20 bg-energizing/5" : 
                                       isDraining ? "text-draining border-draining/20 bg-draining/5" : 
                                       "text-muted-foreground border-white/10 bg-white/5";
                    
                    return (
                      <div key={i} className={`p-4 rounded-2xl border ${colorClass}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-serif text-lg text-foreground">{conn.personName}</h4>
                          <span className={`text-xs font-bold uppercase tracking-wider ${
                            isEnergizing ? "text-energizing" : isDraining ? "text-draining" : "text-muted-foreground"
                          }`}>
                            {conn.classification}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/70 line-clamp-3">
                          {conn.insight}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <User className="w-12 h-12 mb-3 mx-auto opacity-20" />
                  <p>Not enough interaction data to map your circle.</p>
                </div>
              )}
            </motion.div>
            
          </motion.div>
        ) : (
          <div className="h-64 glass rounded-3xl flex flex-col items-center justify-center text-center p-8 border-white/5">
            <Compass className="w-10 h-10 text-blue-400 mb-4 opacity-50" />
            <p className="font-serif text-2xl text-foreground mb-2">Not enough data yet</p>
            <p className="text-muted-foreground">Log more interactions to unlock your social circle analysis.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
