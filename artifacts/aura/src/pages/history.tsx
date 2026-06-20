import { useListInteractions, useDeleteInteraction, getListInteractionsQueryKey } from "@workspace/api-client-react";
import { PageTransition, staggerContainer, staggerItem } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Trash2, Loader2, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function HistoryPage() {
  const { data: interactions, isLoading } = useListInteractions();
  const deleteInteraction = useDeleteInteraction();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteInteraction.mutate({ id }, {
      onSuccess: () => {
        if (typeof pendo !== "undefined") {
          pendo.track("interaction_deleted", {
            interactionId: id,
          });
        }
        queryClient.invalidateQueries({ queryKey: getListInteractionsQueryKey() });
        toast({ description: "Entry removed from journal." });
        setDeletingId(null);
      },
      onError: () => {
        toast({ description: "Failed to delete entry.", variant: "destructive" });
        setDeletingId(null);
      }
    });
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">The Archive.</h1>
          <p className="text-muted-foreground text-lg">Your complete history of social energy flows.</p>
        </header>

        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 glass rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : interactions && interactions.length > 0 ? (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
                {interactions.map((entry) => {
                  const delta = entry.energyDelta || (entry.energyAfter - entry.energyBefore);
                  const isPositive = delta > 0;
                  const isNeutral = delta === 0;

                  return (
                    <motion.div 
                      key={entry.id} 
                      layout
                      variants={staggerItem} 
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                      className="glass rounded-3xl p-5 sm:p-6 border-white/5 relative overflow-hidden group hover:bg-white/5 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 border ${
                            isPositive ? 'bg-energizing/10 border-energizing/20 text-energizing' : 
                            isNeutral ? 'bg-white/5 border-white/10 text-muted-foreground' : 
                            'bg-draining/10 border-draining/20 text-draining'
                          }`}>
                            <span className="font-serif text-xl leading-none">{isPositive ? '+' : ''}{delta}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-medium text-foreground mb-1">{entry.personName}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="uppercase tracking-wider px-2 py-1 bg-white/5 rounded-md">
                                {entry.interactionType.replace('_', ' ')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                              <span>{entry.durationMinutes} min</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t border-white/5 sm:border-0 pt-4 sm:pt-0">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Shift: </span>
                            <span className="text-foreground font-serif">{entry.energyBefore} → {entry.energyAfter}</span>
                          </div>
                          
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/50"
                            data-testid={`btn-delete-${entry.id}`}
                            aria-label="Delete entry"
                          >
                            {deletingId === entry.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {entry.notes && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-sm text-muted-foreground/80 italic">"{entry.notes}"</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="h-64 glass rounded-3xl flex flex-col items-center justify-center text-center p-8 border-white/5">
              <Calendar className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
              <p className="font-serif text-2xl text-foreground mb-2">The archive is empty.</p>
              <p className="text-muted-foreground">Your social history will appear here once you log an interaction.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}