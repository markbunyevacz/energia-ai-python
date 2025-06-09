import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquarePlus } from 'lucide-react';
import { UserFeedback, FeedbackCategory } from '@/core-legal-platform/feedback/types';

interface DetailedFeedbackModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (feedback: Omit<UserFeedback, 'interactionId' | 'agentId' | 'timestamp'>) => void;
  feedbackGiven?: 'up' | 'down' | null;
}

export function DetailedFeedbackModal({ isOpen, onOpenChange, onSubmit, feedbackGiven }: DetailedFeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [comments, setComments] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');

  const handleSubmit = () => {
    if (!category) return;
    
    onSubmit({
      rating: feedbackGiven ?? undefined,
      category,
      comments,
      suggestedCorrection,
    });
    // Reset form after submission
    setCategory('');
    setComments('');
    setSuggestedCorrection('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquarePlus className="h-4 w-4 mr-2" /> Részletes visszajelzés
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Részletes visszajelzés</DialogTitle>
          <DialogDescription>
            Segítsen nekünk jobban teljesíteni. Adja meg, mi volt a probléma.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Kategória
            </Label>
            <Select onValueChange={(value) => setCategory(value as FeedbackCategory)} value={category}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Válasszon egy kategóriát" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inaccurate Information">Pontatlan információ</SelectItem>
                <SelectItem value="Unhelpful Response">Nem segítőkész válasz</SelectItem>
                <SelectItem value="Formatting Issue">Formázási probléma</SelectItem>
                <SelectItem value="Other">Egyéb</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="comment" className="text-right">
              Megjegyzés
            </Label>
            <Textarea
              id="comment"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="col-span-3"
              placeholder="Kérjük, fejtse ki bővebben..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="suggestion" className="text-right">
              Javaslat
            </Label>
            <Textarea
              id="suggestion"
              value={suggestedCorrection}
              onChange={(e) => setSuggestedCorrection(e.target.value)}
              className="col-span-3"
              placeholder="Hogyan nézett volna ki egy jobb válasz?"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Mégse</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={!category}>Küldés</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 