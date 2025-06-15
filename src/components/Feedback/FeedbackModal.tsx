import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FeedbackService } from '@/core-legal-platform/feedback/FeedbackService';
import { UserFeedback, FeedbackCategory } from '@/core-legal-platform/feedback/types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackService: FeedbackService;
  interactionId: string;
  agentId: string;
  userId?: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  feedbackService,
  interactionId,
  agentId,
  userId,
}: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>('Other');
  const [comments, setComments] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comments) {
      setError('A megjegyzés mező kitöltése kötelező.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const feedback: Omit<UserFeedback, 'id' | 'created_at'> = {
      interaction_id: interactionId,
      agent_id: agentId,
      user_id: userId,
      category,
      comments,
      suggested_correction: suggestedCorrection || undefined,
    };

    try {
      await feedbackService.collectFeedback(feedback);
      onClose(); // Close modal on success
    } catch (err) {
      setError('Hiba történt a visszajelzés beküldése közben.');
      // console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Részletes Visszajelzés</DialogTitle>
          <DialogDescription>
            Segítsen nekünk jobban teljesíteni. Kérjük, ossza meg velünk a gondolatait.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Kategória
            </Label>
            <Select onValueChange={(value: FeedbackCategory) => setCategory(value)} defaultValue={category}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Válasszon kategóriát" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inaccurate Information">Pontatlan Információ</SelectItem>
                <SelectItem value="Unhelpful Response">Nem segítőkész válasz</SelectItem>
                <SelectItem value="Formatting Issue">Formázási Probléma</SelectItem>
                <SelectItem value="Other">Egyéb</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="comments" className="text-right">
              Megjegyzések
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="col-span-3"
              placeholder="Miért adta ezt az értékelést?"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="correction" className="text-right">
              Javasolt Javítás
            </Label>
            <Textarea
              id="correction"
              value={suggestedCorrection}
              onChange={(e) => setSuggestedCorrection(e.target.value)}
              className="col-span-3"
              placeholder="(Opcionális) Hogyan nézne ki egy jobb válasz?"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Mégse
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Küldés...' : 'Visszajelzés Küldése'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
