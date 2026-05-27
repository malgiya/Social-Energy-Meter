import { useGetInteractionSummary, useGetEnergyTrends, useListInteractions } from "@workspace/api-client-react";
import { PageTransition, staggerContainer, staggerItem } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Battery, BatteryMedium, BatteryWarning, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetInteractionSummary();
  const { data: trends, isLoading: loadingTrends } = useGetEnergyTrends();
  const { data: interactions, isLoading: loadingInteractions } = useListInteractions();

  const recentInteractions = interactions?.slice(0, 5) || [];

  const getBurnoutIcon = (level?: string) => {
    switch (level) {
      case "low": return <Battery className="text-energizing" />;
      case "moderate": return <BatteryMedium className="text-yellow-400" />;
      case "high": return <BatteryWarning className="text-orange-500" />;
      case "critical": return <BatteryWarning className="text-destructive" />;
      default: return <BatteryMedium className="text-muted-foreground" />;
    }
  };

  const getBurnoutLabel = (level?: string) => {
    switch (level) {
      case "low": return "Rested & Ready";
      case "moderate": return "Stable";
      case "high": return "Approaching Burnout";
      case "critical": return "Socially Exhausted";
      default: return "Unknown";
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">Welcome back.</h1>
          <p className="text-muted-foreground text-lg">Here is your social energy reading for today.</p>
        </header>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Main Energy Score */}
          <motion.div variants={staggerItem} className="md:col-span-2 glass rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 group-hover:bg-primary/20 transition-colors duration-700" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Battery</h3>
                <div className="mt-4 flex items-baseline gap-4">
                  {loadingSummary ? (
                    <div className="h-16 w-24 bg-white/5 animate-pulse rounded-lg" />
                  ) : (
                    <>
                      <span className="font-serif text-7xl text-foreground">
                        {summary?.todayEnergyScore !== null ? summary?.todayEnergyScore : '--'}
                      </span>
                      <span className="text-xl text-muted-foreground">/ 10</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weekly Delta</p>
                  <p className={`text-lg font-medium ${
                    (summary?.weeklyAvgDelta || 0) > 0 ? 'text-energizing' : 
                    (summary?.weeklyAvgDelta || 0) < 0 ? 'text-draining' : 'text-foreground'
                  }`}>
                    {summary?.weeklyAvgDelta !== null && summary?.weeklyAvgDelta !== undefined 
                      ? `${summary.weeklyAvgDelta > 0 ? '+' : ''}${summary.weeklyAvgDelta.toFixed(1)}` 
                      : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Most Energizing</p>
                  <p className="text-lg font-medium text-foreground capitalize">
                    {summary?.mostEnergizingType?.replace('_', ' ') || 'None yet'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Burnout Status */}
          <motion.div variants={staggerItem} className="glass rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02]" />
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-2 border border-white/10">
                {getBurnoutIcon(summary?.burnoutLevel)}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Current State</h3>
                <p className="text-xl font-serif">
                  {loadingSummary ? "..." : getBurnoutLabel(summary?.burnoutLevel)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Trend Chart */}
          <motion.div variants={staggerItem} className="md:col-span-3 glass rounded-3xl p-6 h-[300px] flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">7-Day Energy Flow</h3>
            <div className="flex-1 min-h-0 w-full">
              {loadingTrends ? (
                <div className="w-full h-full bg-white/5 animate-pulse rounded-xl" />
              ) : trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                      formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}`, 'Net Energy']}
                      labelFormatter={(label) => format(parseISO(label as string), 'MMM d, yyyy')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="netEnergyDelta" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorNet)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  Not enough data to show trends.
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent List */}
          <motion.div variants={staggerItem} className="md:col-span-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">Recent Interactions</h3>
            <div className="space-y-3">
              {loadingInteractions ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />
                ))
              ) : recentInteractions.length > 0 ? (
                recentInteractions.map((interaction) => {
                  const delta = interaction.energyDelta || (interaction.energyAfter - interaction.energyBefore);
                  const isPositive = delta > 0;
                  const isNeutral = delta === 0;

                  return (
                    <div key={interaction.id} className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isPositive ? 'bg-energizing/10 text-energizing' : 
                          isNeutral ? 'bg-muted text-muted-foreground' : 'bg-draining/10 text-draining'
                        }`}>
                          <Zap size={20} className={isPositive ? 'fill-energizing' : ''} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{interaction.personName}</p>
                          <p className="text-sm text-muted-foreground capitalize">{interaction.interactionType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-serif text-2xl ${
                          isPositive ? 'text-energizing' : isNeutral ? 'text-muted-foreground' : 'text-draining'
                        }`}>
                          {isPositive ? '+' : ''}{delta}
                        </p>
                        <p className="text-xs text-muted-foreground">Energy Delta</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
                  No interactions logged yet. Time to track your first one.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
}