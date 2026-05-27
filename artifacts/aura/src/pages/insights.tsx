import { useListInsights, useGenerateInsights, getListInsightsQueryKey } from "@workspace/api-client-react";
import { PageTransition, staggerContainer, staggerItem } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, AlertCircle, RefreshCw, Leaf } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Insights() {
  const { data: insights, isLoading } = useListInsights();
  const generateInsights = useGenerateInsights();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGenerate = () => {
    generateInsights.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInsightsQueryKey() });
        toast({ title: "Oracle consulted", description: "New insights have been woven." });
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not generate insights at this time.", variant: "destructive" });
      }
    });
  };

  const getCategoryConfig = (category: string) => {
    switch(category) {
      case "pattern": return { icon: Brain, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" };
      case "burnout_warning": return { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" };
      case "recovery_suggestion": return { icon: Leaf, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" };
      case "social_tip": return { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
      default: return { icon: Sparkles, color: "text-muted-foreground", bg: "bg-white/5", border: "border-white/10" };
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">The Oracle.</h1>
            <p className="text-muted-foreground text-lg">AI-woven patterns from your social journal.</p>
          </div>
          
          <Button 
            onClick={handleGenerate}
            disabled={generateInsights.isPending || isLoading}
            className="bg-white/5 hover:bg-white/10 text-foreground border border-white/10 backdrop-blur-md transition-all duration-300 rounded-xl px-6 h-12"
            data-testid="button-generate-insights"
          >
            {generateInsights.isPending ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin text-primary" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
            )}
            Consult Oracle
          </Button>
        </header>

        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 glass rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : insights && insights.length > 0 ? (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {insights.map((insight) => {
                const config = getCategoryConfig(insight.category);
                const Icon = config.icon;
                return (
                  <motion.div key={insight.id} variants={staggerItem} className={`glass rounded-3xl p-6 border ${config.border} relative overflow-hidden group transition-all duration-500 hover:bg-white/5`}>
                    <div className="flex gap-4 sm:gap-6 relative z-10">
                      <div className={`shrink-0 w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className={`text-xs font-bold tracking-wider uppercase ${config.color}`}>
                            {insight.category.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(insight.createdAt))} ago
                          </span>
                        </div>
                        <p className="text-foreground/90 text-lg leading-relaxed font-serif tracking-wide">
                          {insight.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="h-64 glass rounded-3xl flex flex-col items-center justify-center text-center p-8 border-white/5">
              <Sparkles className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
              <p className="font-serif text-2xl text-foreground mb-2">The oracle is quiet.</p>
              <p className="text-muted-foreground">Log more interactions or click the button above to seek wisdom.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}