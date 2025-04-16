import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

import {
  Dialog,
  DialogContent,
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
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Show help instructions"
      >
        <HelpCircle size={isMobile ? 22 : 18} className="text-gray-500" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-sm text-gray-600 space-y-2">
            {typeof instructions === 'string' ? (
              instructions.split('\n').map((paragraph, i) => (
                paragraph.trim() ? <p key={i} className="my-2">{paragraph}</p> : null
              ))
            ) : (
              instructions
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}