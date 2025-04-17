import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HelpModalProps {
  title: string;
  instructions: React.ReactNode;
  onClose: () => void;
}

export default function HelpModal({ title, instructions, onClose }: HelpModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="text-sm text-muted-foreground">
            {instructions}
          </div>
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}