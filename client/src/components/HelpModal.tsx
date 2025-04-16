import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpModalProps {
  title: string;
  instructions: string | React.ReactNode;
}

export default function HelpModal({ title, instructions }: HelpModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Show help instructions"
      >
        <HelpCircle size={isMobile ? 22 : 18} className="text-gray-500" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-2">
            {typeof instructions === 'string' ? (
              instructions.split('\n').map((paragraph, i) => (
                <p key={i} className="my-2">{paragraph}</p>
              ))
            ) : (
              instructions
            )}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}