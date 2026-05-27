import { useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { useCreateInteraction, getListInteractionsQueryKey, getGetInteractionSummaryQueryKey, getGetEnergyTrendsQueryKey, getListPeopleEnergyQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const interactionTypes = [
  { value: "work_meeting", label: "Work Meeting" },
  { value: "friend_hangout", label: "Friend Hangout" },
  { value: "family_call", label: "Family Call" },
  { value: "party", label: "Party" },
  { value: "texting", label: "Texting" },
  { value: "date", label: "Date" },
  { value: "group_event", label: "Group Event" },
  { value: "solo_activity", label: "Solo Activity" },
  { value: "other", label: "Other" },
];

export default function LogInteraction() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createInteraction = useCreateInteraction();

  const [personName, setPersonName] = useState("");
  const [interactionType, setInteractionType] = useState<any>("friend_hangout");
  const [energyBefore, setEnergyBefore] = useState(5);
  const [energyAfter, setEnergyAfter] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      toast({ title: "Name required", description: "Please enter who you interacted with.", variant: "destructive" });
      return;
    }

    createInteraction.mutate(
      {
        data: {
          personName,
          interactionType,
          energyBefore,
          energyAfter,
          durationMinutes: Number(durationMinutes),
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInteractionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetInteractionSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEnergyTrendsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPeopleEnergyQueryKey() });
          toast({ title: "Logged successfully", description: "Your energy shift has been recorded." });
          setLocation("/");
        },
        onError: () => {
          toast({ title: "Error", description: "Could not log interaction.", variant: "destructive" });
        },
      }
    );
  };

  const delta = energyAfter - energyBefore;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-foreground">Log Energy Shift</h1>
          <p className="text-muted-foreground">Record how a recent interaction affected your battery.</p>
        </header>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 sm:p-10 space-y-10">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="personName" className="text-muted-foreground uppercase tracking-wider text-xs">Who was it?</Label>
                <Input 
                  id="personName" 
                  value={personName} 
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g., Sarah"
                  className="bg-black/20 border-white/10 text-lg py-6 focus-visible:ring-primary"
                  data-testid="input-person-name"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground uppercase tracking-wider text-xs">Context</Label>
                <Select value={interactionType} onValueChange={setInteractionType}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-lg py-6 h-auto focus:ring-primary" data-testid="select-interaction-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {interactionTypes.map(t => (
                      <SelectItem key={t.value} value={t.value} className="focus:bg-white/10">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-12">
              {/* Energy Before */}
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <Label className="text-muted-foreground uppercase tracking-wider text-xs">Energy Before</Label>
                  <span className="font-serif text-3xl text-foreground/80">{energyBefore}</span>
                </div>
                <Slider 
                  value={[energyBefore]} 
                  onValueChange={(v) => setEnergyBefore(v[0])} 
                  max={10} min={1} step={1}
                  className="py-4"
                  data-testid="slider-energy-before"
                />
              </div>

              {/* Energy After */}
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <Label className="text-muted-foreground uppercase tracking-wider text-xs">Energy After</Label>
                  <span className="font-serif text-3xl text-primary">{energyAfter}</span>
                </div>
                <Slider 
                  value={[energyAfter]} 
                  onValueChange={(v) => setEnergyAfter(v[0])} 
                  max={10} min={1} step={1}
                  className="py-4"
                  data-testid="slider-energy-after"
                />
              </div>
            </div>

            {/* Dynamic visual feedback */}
            <div className={`p-6 rounded-2xl text-center border transition-all duration-500 ${
              delta > 0 ? 'bg-energizing/10 border-energizing/20 text-energizing' :
              delta < 0 ? 'bg-draining/10 border-draining/20 text-draining' :
              'bg-white/5 border-white/10 text-muted-foreground'
            }`}>
              <p className="font-serif text-2xl">
                {delta > 0 ? `Gained ${delta} energy` : delta < 0 ? `Drained ${Math.abs(delta)} energy` : 'Energy remained neutral'}
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="duration" className="text-muted-foreground uppercase tracking-wider text-xs">Duration (minutes)</Label>
                <Input 
                  id="duration" 
                  type="number"
                  min="1"
                  value={durationMinutes} 
                  onChange={(e) => setDurationMinutes(e.target.value as any)}
                  className="bg-black/20 border-white/10 py-6"
                  data-testid="input-duration"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes" className="text-muted-foreground uppercase tracking-wider text-xs">Private Notes (Optional)</Label>
                <Textarea 
                  id="notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What was discussed? How did you feel?"
                  className="bg-black/20 border-white/10 resize-none h-24"
                  data-testid="input-notes"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={createInteraction.isPending}
            className="w-full h-14 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 glow-primary transition-all duration-300"
            data-testid="button-submit-log"
          >
            {createInteraction.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save to Journal"}
          </Button>
        </form>
      </div>
    </PageTransition>
  );
}