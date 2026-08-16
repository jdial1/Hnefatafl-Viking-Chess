import { BookOpen, Crown } from '../icons';
import React from 'react';
import { Modal, ModalBody } from './Modal';
import { ModalHeader } from './ModalHeader';
import { RoleSummary, SectionTitle } from './ui';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOVEMENT = [
  {
    title: 'Rook-like movement',
    body: 'All pieces move orthogonally any number of unblocked squares (like Rooks in Chess). No leaping over other pieces.',
    note: 'Only the King can enter the four corner refuges and central throne.',
  },
  {
    title: 'Custodial capture',
    body: 'Flank an enemy piece on two opposite sides, horizontally or vertically, to capture it.',
    bullets: [
      'Corner refuges and empty Throne count as hostile capture squares.',
      'Moving voluntarily between two enemies is safe and does not cause a capture.',
    ],
  },
  {
    title: 'Capturing the King',
    body: 'On or beside the central throne, the King requires a four-sided surround. On open tiles, a two-sided capture applies.',
  },
];

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Hnefatafl rules" maxWidth="lg">
      <ModalHeader
        title="Hnefatafl Rules"
        subtitle="Movement, capture, and victory"
        icon={<BookOpen className="w-5 h-5 text-amber-300" />}
        onClose={onClose}
        closeAriaLabel="Close rules modal"
      />

      <ModalBody className="space-y-5 text-sm text-slate-300 leading-6">
        <section className="pb-5 border-b border-slate-800">
          <SectionTitle as="h3" icon={Crown} className="mb-3">
            Victory objectives
          </SectionTitle>
          <RoleSummary field="rules" className="space-y-3" />
        </section>

        {MOVEMENT.map((section) => (
          <section key={section.title} className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">{section.title}</h3>
            <p className="text-sm text-slate-300 leading-6">{section.body}</p>
            {section.note && <p className="text-sm text-amber-300 font-medium">{section.note}</p>}
            {section.bullets && (
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </ModalBody>
    </Modal>
  );
};
